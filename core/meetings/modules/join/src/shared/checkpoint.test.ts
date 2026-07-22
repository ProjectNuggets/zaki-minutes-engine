/** L2: a checkpoint screenshot is diagnostics — it must NEVER throw into the join,
 *  whatever the filesystem or the page does (the EROFS incident killed every hosted
 *  join ~1s after navigation for a debug PNG). */
import { mkdtempSync, existsSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { checkpoint, resetCheckpointDirForTest } from "./checkpoint";

let failed = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) failed++;
};

let shots = 0;
const pageOk = { screenshot: async (_: unknown) => { shots++; return Buffer.alloc(0); } } as never;
const pageThrows = { screenshot: async () => { throw new Error("EROFS: read-only file system"); } } as never;

async function main() {
  // 1. writable dir → screenshot lands under it
  const dir = mkdtempSync(join(tmpdir(), "ckpt-"));
  process.env.BOT_SCREENSHOT_DIR = dir;
  resetCheckpointDirForTest();
  let taken: string | null = null;
  const pageRecords = { screenshot: async (o: { path: string }) => { taken = o.path; return Buffer.alloc(0); } } as never;
  await checkpoint(pageRecords, "unit-a");
  check("writes under BOT_SCREENSHOT_DIR", taken !== null && taken!.startsWith(dir));

  // 2. page.screenshot throwing (EROFS et al.) resolves silently
  let threw = false;
  try { await checkpoint(pageThrows, "unit-b"); } catch { threw = true; }
  check("page.screenshot throw never propagates", !threw);

  // 3. unwritable dir → disabled for the session, still never throws.
  //    A path UNDER A REGULAR FILE fails mkdir with ENOTDIR instantly on every OS —
  //    the previous /proc path HUNG mkdirSync on GitHub's runners. The mechanism, measured
  //    in node:22-bookworm: mkdir inside procfs reports ENOENT rather than EPERM, so
  //    recursive mkdirSync walks up to /proc, finds it present, retries the child, gets
  //    ENOENT again — a 100%-CPU spin that never returns. macOS has no /proc, so it threw
  //    there and every local run passed in <1s while CI burned the 6h job timeout. Note a
  //    chmod-0500 dir would NOT work either: root ignores it, so a root CI container would
  //    silently skip this check. ENOTDIR is the only shape that holds everywhere.
  const blocker = join(dir, "not-a-dir");
  writeFileSync(blocker, "x");
  process.env.BOT_SCREENSHOT_DIR = join(blocker, "sub");
  resetCheckpointDirForTest();
  threw = false;
  shots = 0;
  try { await checkpoint(pageOk, "unit-c"); await checkpoint(pageOk, "unit-d"); } catch { threw = true; }
  check("unwritable dir never propagates", !threw);
  // Proves the directory was genuinely rejected: without this, a path that quietly became
  // creatable would still pass the check above while testing nothing at all.
  check("unwritable dir disables capture for the session", shots === 0);

  delete process.env.BOT_SCREENSHOT_DIR;
  resetCheckpointDirForTest();
  rmSync(dir, { recursive: true, force: true });
  check("cleanup", !existsSync(join(dir, "bot-checkpoint-unit-a.png")));

  if (failed) { console.error(`\n❌ checkpoint (L2): ${failed} check(s) FAILED.`); process.exit(1); }
  console.log("\n✅ checkpoint (L2): all green.");
}
main().catch((e) => { console.error(e); process.exit(1); });
