/**
 * Security gate: a caller-supplied string form value (language / prompt / model — any of which
 * can originate untrusted from a direct POST /bots body) must NOT be able to inject or forge
 * multipart framing. The STT egress builds the body itself; CR/LF in a value is the injection
 * vector (a forged `--boundary` or `Content-Disposition:` line splits the request). This asserts
 * the encoder strips CR/LF so no extra part can appear. Stubs global fetch to capture the body.
 * Run: npm test (chained)  or  npx tsx src/crlf.test.ts
 */
import { TranscriptionClient } from './index.js';

let failed = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? '✅' : '❌'} ${name}${cond ? '' : '  — ' + detail}`);
  if (!cond) failed++;
};

const realFetch = globalThis.fetch;
/** Replace global fetch with a 200 stub that CAPTURES the multipart body (latin1, byte-exact). */
function captureFetch(): () => string {
  let body = '';
  (globalThis as any).fetch = async (_url: unknown, init: { body: Buffer }) => {
    body = Buffer.from(init.body).toString('latin1');
    return new Response(JSON.stringify({ text: 'ok', language: 'en', duration: 0.1, segments: [] }), { status: 200 });
  };
  return () => body;
}
/** Count the multipart part headers a real parser would see (each is a CRLF-anchored line). */
const cdCount = (body: string) => (body.match(/\r\nContent-Disposition:/g) || []).length;
/** The raw bytes a parser reads as the value of `name` (up to the next boundary delimiter). */
function valueOf(body: string, name: string): string | null {
  const m = body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`));
  return m ? m[1] : null;
}

async function run() {
  const pcm = new Float32Array(1600).fill(0.05); // 0.1s of audio

  // A CRLF payload that tries to forge a whole extra part (a `task` override) mid-value.
  const inject = (label: string) =>
    `${label}\r\nContent-Disposition: form-data; name="task"\r\n\r\ntranslate\r\n--forged\r\n`;

  // Baseline: clean values → the honest part count.
  const clean = captureFetch();
  await new TranscriptionClient({ serviceUrl: 'http://stt.test' }).transcribe(pcm, 'en', 'prior text');
  const baseParts = cdCount(clean());

  // Injected: CRLF-bearing language AND prompt. Must not add a single part.
  const evil = captureFetch();
  await new TranscriptionClient({ serviceUrl: 'http://stt.test' })
    .transcribe(pcm, inject('en'), inject('prior text'));
  const evilBody = evil();

  check('CRLF language/prompt inject NO extra part (count unchanged vs baseline)',
    cdCount(evilBody) === baseParts, `baseline=${baseParts} injected=${cdCount(evilBody)}`);
  check('no forged `task` part appears in the wire',
    !/\r\nContent-Disposition: form-data; name="task"/.test(evilBody), 'a forged part header survived');
  check('emitted `language` value carries no raw CR/LF',
    !/[\r\n]/.test(valueOf(evilBody, 'language') ?? ''), JSON.stringify(valueOf(evilBody, 'language')));
  check('emitted `prompt` value carries no raw CR/LF',
    !/[\r\n]/.test(valueOf(evilBody, 'prompt') ?? ''), JSON.stringify(valueOf(evilBody, 'prompt')));

  // A CRLF-bearing model id (config-sourced, but the same egress) is sanitized too.
  const evilModel = captureFetch();
  await new TranscriptionClient({ serviceUrl: 'http://stt.test', model: 'm\r\n--x\r\nContent-Disposition: x' })
    .transcribe(pcm, 'en');
  check('CRLF model id injects no extra part', cdCount(evilModel()) === baseParts - 1 /* no prompt this run */,
    `parts=${cdCount(evilModel())}`);

  // A CRLF-bearing task (untrusted — #37 wired `task` onto this egress and it can arrive from a
  // direct POST /bots body) is sanitized like every other value: no forged part, no raw CR/LF.
  const evilTask = captureFetch();
  await new TranscriptionClient({ serviceUrl: 'http://stt.test', task: 'transcribe\r\n--forged\r\nContent-Disposition: form-data; name="x"\r\n\r\nboom' })
    .transcribe(pcm, 'en');
  const evilTaskBody = evilTask();
  check('CRLF task injects no extra part', cdCount(evilTaskBody) === baseParts /* +task, −prompt vs baseline */,
    `baseline=${baseParts} task-run=${cdCount(evilTaskBody)}`);
  check('no forged `x` part appears from a CRLF task',
    !/\r\nContent-Disposition: form-data; name="x"/.test(evilTaskBody), 'a forged part header survived the task value');
  check('emitted `task` value carries no raw CR/LF',
    !/[\r\n]/.test(valueOf(evilTaskBody, 'task') ?? ''), JSON.stringify(valueOf(evilTaskBody, 'task')));

  (globalThis as any).fetch = realFetch;
  if (failed) { console.error(`\n❌ stt crlf: ${failed} check(s) FAILED.`); process.exit(1); }
  console.log('\n✅ stt crlf: CR/LF in any string form value is stripped at the egress — framing cannot be injected.');
}
run().catch((e) => { console.error(e); process.exit(1); });
