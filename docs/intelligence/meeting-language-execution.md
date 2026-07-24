# Execution Plan — Meeting Language Selection (PR)

Worktree: `../vexa-meeting-language` · branch `feat/minutes-meeting-language` (from `main` 8fe6a905).

## Goal
Let a user choose the meeting's transcription language (**Auto-detect** default, or a specific language) so non-English meetings stop being mis-detected/translated to English by Together's flaky auto-detect. Backend already accepts `language`; the gaps are the terminal UI and the severed `task` field.

## Global constraints
- **Default stays auto-detect** (owner's explicit instruction): "Auto-detect" ⇒ the client OMITS `language` from the request body (backend `None` ⇒ Whisper auto). Never send `"auto"` as a language code.
- Minimal diff; reuse existing plumbing (`language`/`task` already flow API→invocation→bot). No schema migration in this PR.
- Match existing house style (imports, Tailwind/UI patterns) in the terminal.
- Every non-trivial change leaves one runnable check.
- `allowedLanguages` is a dead contract field (unimplemented; Whisper takes one language) — do NOT build on it.

## Scope (this PR)
1. Backend: force `task='transcribe'` default through the STT client (wire the accepted-but-dropped `task` field).
2. Frontend: language picker in the terminal start-bot flow → include `language` in POST body (omit for Auto).
3. Docs + changelog fragment.

## Deferred (follow-ups, note in PR)
- Account/workspace **default_language** (schema + settings API + UI).
- Live `set_language` (meeting-api `/config` route + orchestrator reconfigure; currently a no-op at orchestrator.ts:131-134).
- Recording playback in terminal (audit #4).

---

## Task 1 — Wire `task` through the STT client, default `transcribe` (backend, TS, small)
**Files:**
- `core/meetings/modules/whisper/src/transcription-client.ts`
  - `TranscriptionClientConfig` (interface ~L29–50): add `task?: string;`
  - Constructor (~L102–115): store `this.task = config.task;` (private field, add declaration ~L94–101).
  - `sendRequest` (~L157–229): after the `language` part (~L186–193), emit a `task` form part **iff** `this.task` is set:
    ```
    if (this.task) { parts.push(Buffer.from(`--${boundary}\r\n` + `Content-Disposition: form-data; name="task"\r\n\r\n` + `${this.task}\r\n`)); }
    ```
- `core/meetings/services/bot/src/pipeline.ts`
  - `createTranscribe` (~L231–242): pass `task: inv.task ?? 'transcribe'` into the `new TranscriptionClient({...})` config.
**Rationale:** the STT service accepts `task` (main.py:283) and the API accepts it (router.py:280), but the client never sends it → accepted-but-ignored. Default `transcribe` makes intent explicit and prevents accidental translation; an explicit `inv.task` (e.g. from MCP) now actually works. (Note: Together ignores unknown `task`; this is correctness for self-hosted STT + explicit intent.)
**Acceptance:**
- Unit: a test asserts the multipart body sent by `sendRequest` contains a `name="task"` part with value `transcribe` when task defaults, and the configured value when set. (Add to an existing whisper test, or a focused new one — model-free, inspect the request.)
- `createTranscribe` passes `task='transcribe'` when `inv.task` is null/undefined (assert via a stub client or the existing pipeline.test.ts seam).
- Red→green: before, no `task` part; after, present.

## Task 2 — Terminal language picker (frontend) — SPEC FROM RECON (pending agent a3feaf5f)
Fill from the terminal-recon output: exact POST call sites, the Next `/api/bots` proxy (does it pass through `language`?), the start-bot UI component, the request body type, and an existing `<select>` pattern to match.
**Shape:**
- Add a `LANGUAGES` constant (code+label), curated (Auto-detect, English, German, Arabic, Spanish, French, Italian, Portuguese, Dutch, Russian, Chinese, Japanese, Korean, Turkish, Hindi, … ~20).
- Add a `<select>` (default "Auto-detect") to the start-bot form; store selection in the surface's state.
- Include `language` in the POST body **only when not Auto**; add `language?: string` to the request type.
- Ensure the Next `/api/bots` route forwards `language` (whitelist it if the route filters fields).
**Acceptance:** picking German and starting a bot sends `{..., language:"de"}`; "Auto-detect" omits it. Verified in the running terminal app (network body) or a component test if one exists.

## Task 3 — Docs + changelog (small)
- `docs/changelog.d/<pr>-meeting-language.md` — one-line fragment (per docs/changelog.d/README).
- Docs page note (transcription/usage): the new language setting; auto-detect caveat ("best-effort, one primary language").
- MCP `language` field description already exists (`vexa_mcp/app.py:90`) — verify it's accurate; tweak if needed.
**Acceptance:** changelog fragment present; docs mention the setting.
