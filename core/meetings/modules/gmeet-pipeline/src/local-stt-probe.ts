/** LOCAL DIAGNOSTIC (not committed): drives the REAL gmeet pipeline + REAL
 *  TranscriptionClient against Together with locally synthesized speech —
 *  exactly the production wiring including the model id — to split
 *  "pipeline/STT broken" from "bot page-bridge broken" for the round-3
 *  zero-transcript finding. */
import { readFileSync } from "fs";
import { createGmeetPipeline } from "./index";
import { TranscriptionClient } from "@vexa/transcribe-whisper";

const URL = process.env.VEXA_TX_URL!;
const KEY = process.env.VEXA_TX_KEY!;
const MODEL = process.env.VEXA_STT_MODEL || "openai/whisper-large-v3";
const CLIPS = [
  { path: process.env.CLIP_A!, name: "Alice" },
  { path: process.env.CLIP_B!, name: "Bob" },
];

function wavToF32(path: string): Float32Array {
  const buf = readFileSync(path);
  const data = buf.subarray(44); // canonical PCM WAV header
  const out = new Float32Array(Math.floor(data.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = data.readInt16LE(i * 2) / 32768;
  return out;
}

async function run() {
  const client = new TranscriptionClient({ serviceUrl: URL, apiToken: KEY, model: MODEL });
  const segments: Array<{ speaker?: string; text?: string; source?: string }> = [];
  const sink = { segment: (s: any) => segments.push(s), draft: () => {}, finalize: () => {} };
  const pipe = createGmeetPipeline({ transcribe: (pcm: Float32Array, prompt?: string) => client.transcribe(pcm, "en", prompt), sink: sink as never });

  let ts = 0;
  for (let ch = 0; ch < CLIPS.length; ch++) {
    const pcm = wavToF32(CLIPS[ch].path);
    console.log(`feeding ch${ch} (${CLIPS[ch].name}): ${pcm.length} samples (${(pcm.length / 16000).toFixed(1)}s)`);
    for (let o = 0; o < pcm.length; o += 8000) { pipe.feedAudio(ch, CLIPS[ch].name, pcm.subarray(o, o + 8000), ts); ts += 500; }
  }
  await pipe.flush();
  await pipe.dispose();

  for (const s of segments) console.log(`  [${s.speaker}] (${s.source}) ${(s.text || "").slice(0, 90)}`);
  console.log(segments.length > 0 ? `\n✅ ${segments.length} segment(s) — pipeline + Together STT WORK` : "\n❌ ZERO segments — pipeline/STT leg broken");
  process.exit(segments.length > 0 ? 0 : 1);
}
run().catch((e) => { console.error("PROBE ERROR:", e); process.exit(1); });
