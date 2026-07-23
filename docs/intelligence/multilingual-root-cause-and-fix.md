# zaki-minutes — Intelligence Dossier (2026-07-23)

## 1. Executive summary
- **The "multilingual → English" bug is real and is an EXTERNAL Together regression, not our code.** Same audio + same invocation (Together `openai/whisper-large-v3`, `language=None`, `task=None`) transcribed correct German/Arabic on Jul 21 (mtg-13) and English on Jul 23 (mtg-21/24). Zero STT commits in between; mtg-13's pod proves identical config. Together changed `whisper-large-v3` auto-detect/translate behavior.
- **Proven fix:** send an explicit `language` → whisper transcribes correctly every time. Auto-detect (language omitted) is an unreliable coin-flip we can't control.
- **Fix is ~90% built** (API/invocation/STT-client/MCP all carry `language`); missing = per-user default + terminal UI + validated list.
- **Two adjacent gaps found in the audit:** the STT `task` field is dropped at the client (so `translate` never works), and live `set_language` is a **no-op** (orchestrator ignores reconfigure) — language currently only takes effect at bot **start**.

## 2. Root-cause dossier (evidence)
| Meeting | Spoken | Stored (prod) | Local whisper of the recording | Verdict |
|---|---|---|---|---|
| mtg-13 (Jul21) | de/ar/en | de/ar/nl/en ✅ | (multi) | auto-detect worked then |
| mtg-21 (Jul23) | German | en (translated) ❌ | `de` correct | Together mis-detected |
| mtg-22 (Jul23) | English (about langs) | en ✅ | en | false alarm — user spoke English |
| mtg-24 (Jul23) | German | en (translated) ❌ | `de` correct | Together mis-detected |
- Direct Together probe (mtg-21 German audio): no-language → `en`; `+task=transcribe` → still `en` (task irrelevant); `+language=de` → correct German. Normalizing loudness → still `en` (not an audio-level issue).
- Earlier red herrings ruled out with evidence: not audio-capture dropout (recording RMS proved audio present), not the English `initial_prompt` (first window already mis-detects), not model/config change on our side.

## 3. Implementation plan — Meeting Language Selection
Full plan: `PLAN-meeting-language.md`. Phases: (1) first-class per-meeting language + allowlist, (2) account default_language, (3) terminal UI (settings + per-meeting picker), (4) shared list + MCP/docs, (5) optional low-confidence "looks like X?" nudge.
**Corrections from the audit:**
- Terminal `POST /api/bots` sends only `{platform, native_meeting_id, meeting_url, bot_name}` — [meeting.tsx:664/337], [meetingsOnboarding.tsx:151], [meetingPrep.tsx:243]. Phase-3 target confirmed.
- **Live switching needs extra work:** MCP `set_language`/`update_bot_config` exist but `orchestrator.ts:131-134` treats `reconfigure` as a no-op (closure bakes language at construction). So ship "language at start" first; live-switch = separate task (audit #6).
- While here, **wire `task` through the STT client** (`transcription-client.ts` never emits a `task` part; `createTranscribe` ignores `inv.task`) and default it to `transcribe` so translation can't happen accidentally.

## 4. Dormant features we can activate (from code audit)
| # | Feature | State | Effort | Notes |
|---|---|---|---|---|
| 1 | **Post-meeting summaries (the namesake "minutes")** | gated on `SUMMARY_MODEL`; **default-off in code** | trivial | ⚠️ **Already ON in THIS prod** (`SUMMARY_MODEL=Llama-3.3-70B` set). Win applies to lite/compose defaults + docs. |
| 2 | **Terminal language picker** | plumbed, not in UI | small | = plan Phase 3 |
| 3 | **`task` (translate/transcribe) through STT client** | accepted API→invocation→bot, **dropped at client** | small | fix at client; default `transcribe` |
| 4 | **Recording playback/download in terminal** | recording ON by default; server download built ([recordings/router.py:247-306]); **no player in terminal** | medium | users record but can't play back |
| 5 | Per-meeting STT model + VAD latency knobs | client supports; never set at call site | small–med | niche (latency tuning) |
| 6 | Mid-meeting reconfigure (`PUT /config`) | gateway+MCP expose; **meeting-api route missing + orchestrator no-op** | medium | enables live language switch |
| 7 | Voice agent `/speak` | bot-side built, **deferred**, no core handler | large | intentionally deferred |
- Inert placeholders (not features): `videoReceiveEnabled`, `cameraEnabled`, `reconnectionIntervalMs`, `defaultAvatarUrl`; `captureModes` hardcoded (no audio-only option).

## 5. Competitor intelligence (2026)
**Landscape splits: closed SaaS notetakers · bot-API infra · local-first OSS.**

| Product | Type | Multilingual | Lang UX | Arabic | Self-host | Notable |
|---|---|---|---|---|---|---|
| Otter | SaaS | ~7 langs | pick | ✗ | ✗ | English-first incumbent |
| Fireflies | SaaS | 100+ | auto / default / **multi-lang beta** / custom; acct + per-meeting | ✓ | ✗ | best language UX to copy |
| Read.ai | SaaS | 25+ | auto or pick (acct) | ✓ | ✗ | moat = analytics/coaching + cross-surface search; API+MCP |
| Supernormal | SaaS | **7 (cut from 63; dropped Arabic)** | acct-level | ✗ | ✗ | pivoted to bot-free desktop + **agentic deliverables** |
| Recall.ai | Bot API infra | 30+ built-in, **BYO/swappable STT** | undoc | via BYO | ✗ | $0.50/hr + $0.15/hr; widest platforms |
| Attendee | Bot API (OSS-ish) | Deepgram | — | Deepgram | ✓ (Elastic Lic) | self-host Recall clone |
| **Vexa (our upstream)** | Bot API OSS | ~99 (Whisper)+translate | — | ✓ | ✓ Apache-2.0 | 2.6k★ |
| Meetily | Local desktop OSS | **99+ (Whisper)** +Parakeet | auto(`--language all`)+manual; cross-lingual summaries | ✓ | ✓ MIT | **26k★**, diarization, biggest OSS mindshare |
| Hyprnote/Anarlog | Local desktop OSS | 45+ | undoc | ? | ✓ MIT | most active; MCP + BYO-LLM + local LLM |
| Amurex | Browser ext OSS | English only | — | ✗ | ✓ AGPL | cross-app memory search; stalled |

**Strategic reads:**
1. **Language pick + auto-detect is table-stakes** (all majors ship it; account default is the norm). Our picker is catch-up, not innovation.
2. **Code-switching is universally weak/absent** — reliable per-utterance multilingual would be a genuine edge (but hard; no Together model does ar+de+en well).
3. **Arabic is a differentiation lane** — Supernormal dropped it, most target EU; Whisper-based (us, Meetily, Vexa) keep it.
4. **Swappable STT** (Recall/Attendee) directly insulates against provider regressions like the one we just hit → strong case for an STT-provider seam.
5. Rising differentiators: analytics/coaching (Read.ai), **agentic deliverables** (Supernormal), MCP (Read.ai/Supernormal/Anarlog/us).
6. Our lane vs closed SaaS + vs OSS desktop tools: **API/MCP-first, self-host, Apache-licensed, bot-based (server-side, no per-user desktop app), Arabic-capable multilingual.** Meetily/Anarlog own local-desktop; we own the server/API/self-host-fleet niche (closer to Recall/Vexa/Attendee).

## 6. Recommended priorities
1. **Now (ops):** escalate the regression to Together; as a stopgap set `language` via API/MCP for known non-English users (works today).
2. **Ship (small):** language picker at bot-start (plan P1–P3) + wire `task=transcribe` default through the STT client (audit #3) — kills accidental translation.
3. **Consider (medium):** recording playback in terminal (audit #4 — users already pay to record); STT-provider seam (competitive insulation).
4. **Later:** live language switch (audit #6), true multi-language/code-switching (beta), agentic deliverables/analytics as differentiators.
