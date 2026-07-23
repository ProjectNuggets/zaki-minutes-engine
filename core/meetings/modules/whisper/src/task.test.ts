/**
 * The `task` form field (transcribe/translate) is accepted by the invocation and the
 * STT service but was DROPPED at the client — never emitted onto the wire, so a caller's
 * intent to translate silently had no effect. Stubs global fetch and inspects the multipart
 * body ("dropped field" edge — client-level only; createTranscribe's default-to-transcribe
 * wiring is covered separately in the bot service's pipeline.test.ts).
 * Run: npm test (chained)  or  npx tsx src/task.test.ts
 */
import { TranscriptionClient } from './index.js';

let failed = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? '✅' : '❌'} ${name}${cond ? '' : '  — ' + detail}`);
  if (!cond) failed++;
};

const realFetch = globalThis.fetch;
/** Replace global fetch with a 200 stub that CAPTURES the multipart body. */
function captureFetch(): () => string {
  let body = '';
  (globalThis as any).fetch = async (_url: unknown, init: { body: Buffer }) => {
    body = Buffer.from(init.body).toString('latin1');
    return new Response(JSON.stringify({ text: 'ok', language: 'en', duration: 0.1, segments: [] }), { status: 200 });
  };
  return () => body;
}
/** The value of a named form part in a captured multipart body (null if absent). */
function partOf(body: string, name: string): string | null {
  const m = body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)\\r\\n`));
  return m ? m[1] : null;
}

async function run() {
  const pcm = new Float32Array(1600).fill(0.05); // 0.1s of audio

  // Configured task='translate' → the wire carries the task form part.
  {
    const body = captureFetch();
    const client = new TranscriptionClient({ serviceUrl: 'http://stt.test', task: 'translate' });
    await client.transcribe(pcm, 'en');
    check('configured task rides the task form part', partOf(body(), 'task') === 'translate', `got ${JSON.stringify(partOf(body(), 'task'))}`);
    // Negative control: the rest of the multipart body is unaffected by adding task.
    check('file part still present', body().includes('name="file"; filename="audio.wav"'));
    check('model part still present + unchanged', partOf(body(), 'model') === 'whisper-1', `got ${JSON.stringify(partOf(body(), 'model'))}`);
    check('response_format part still present + unchanged', partOf(body(), 'response_format') === 'verbose_json', `got ${JSON.stringify(partOf(body(), 'response_format'))}`);
  }
  // No task configured → the client itself emits no task part (defaulting to "transcribe"
  // is the bot service's job at the createTranscribe seam, not the raw client's).
  {
    const body = captureFetch();
    const client = new TranscriptionClient({ serviceUrl: 'http://stt.test' });
    await client.transcribe(pcm, 'en');
    check('unconfigured → no task part emitted (client does not default)', partOf(body(), 'task') === null, `got ${JSON.stringify(partOf(body(), 'task'))}`);
  }

  (globalThis as any).fetch = realFetch;
  if (failed) { console.error(`\n❌ stt task: ${failed} check(s) FAILED.`); process.exit(1); }
  console.log('\n✅ stt task: the wire carries the configured task form part (the accepted field was dropped at the client).');
}
run().catch((e) => { console.error(e); process.exit(1); });
