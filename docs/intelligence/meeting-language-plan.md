# Implementation Plan — Meeting Language Selection

## Why (grounded)
- Root cause of "non-English shows as English": Together's `openai/whisper-large-v3` auto-detect (language omitted) intermittently mis-IDs non-English and **translates it to English**. Proven by direct API probe.
- **External regression:** identical audio + identical invocation returned correct German/Arabic on Jul 21 and English on Jul 23 — no code/config change on our side (mtg-13 pod invocation == today's). We cannot control Together's auto-detect.
- Fix = give users a **language choice** (keep auto-detect as default, add an explicit-language option) so reliable transcription no longer depends on Together's detection. This is the industry-standard pattern (Fireflies/Otter/Zoom/Teams all ship a language picker).

## Current state — the plumbing already exists (file:line)
- `POST /bots` already accepts `language` — `bot_spawn/router.py:279` (`language=body.get("language")`)
- Invocation carries it — `bot_spawn/invocation.py:175` (`"language": language`)
- Bot builds STT closure with it — `services/bot/src/pipeline.ts:240` (`const language = inv.language ?? undefined`) → `client.transcribe(pcm, language, prompt)`
- Whisper client sends the `language` form field only when set — `modules/whisper/src/transcription-client.ts:187`
- MCP exposes it on start + a live `set_language` — `services/mcp/src/vexa_mcp/app.py:90,113,253`

**Gap:** unset ⇒ `None` ⇒ Together auto-detect (unreliable). Missing: (a) a per-user default, (b) UI to set account default + per-meeting override, (c) a validated language list + explicit "auto" sentinel.

## Design (mirrors Fireflies)
- **Modes:** `auto` (default, unchanged behavior) · `<iso code>` (pin, e.g. `de`/`ar`) · *multi (beta, later)*
- **Levels:** account/workspace **default** + per-meeting **override** (override wins; unset → account default → `auto`)
- **Codes:** ISO-639-1 subset Whisper supports; `auto`/empty = auto-detect.

## Phases

### Phase 1 — Per-meeting language, end to end (ship value first)
Already 90% wired; make it first-class.
- meeting-api: validate `language` on `POST /bots` (allow `auto`/null + a known ISO set; reject junk). Map `auto`→omit. Files: `bot_spawn/router.py`, add a small `LANGUAGES` allowlist module.
- Confirm passthrough to invocation → bot → STT (already works).
- **Acceptance:** start a bot with `language:"de"` on German audio → segments stored `language=de`, German text (not English). Negative: `language:"auto"` → today's behavior. Bad code → 400.

### Phase 2 — Account/workspace default language
- Schema: add `default_language` (nullable, default null=auto) to the user/settings model (identity `admin-api` users table or `platform_settings`).
- Create path: when request `language` is absent, fall back to the user's `default_language`, else `auto`. File: `bot_spawn/router.py` / `capture/service.py:306`.
- API: GET/PATCH user settings to read/set it.
- **Acceptance:** set default `de`; start a bot with no language → transcribes German correctly. Per-meeting `language:"en"` still overrides.

### Phase 3 — Terminal client UI (`clients/terminal`)
- **Settings page:** "Meeting Language" dropdown = `Auto-detect` + curated language list → writes account default (Phase 2 API).
- **Per-meeting picker:** language selector on the start-bot / meeting screen → sends `language` on `POST /bots`.
- Copy: label auto-detect "(best-effort, one primary language)" — set expectations (Fireflies-style).
- **Acceptance:** pick German in UI → new meeting transcribes German; switch to Auto → auto behavior. Verified in the running app.

### Phase 4 — Language list + validation + docs
- One source of truth for the supported list (code+label), shared by API validation, MCP, and UI.
- Update MCP `language` field description + docs site (`docs/docs`) with the new setting and the auto-detect caveat.
- Changelog fragment `docs/changelog.d/<pr>-meeting-language.md`.

### Phase 5 (optional) — Teams-style mismatch nudge
- When Together's returned per-segment `language` disagrees across a meeting with low `language_probability`, surface a hint ("looks like German — set language?") instead of silently committing. Low effort, high UX payoff; uses data we already receive.

## Immediate mitigations (before the above ships)
1. **Works today, zero code:** start bots with `language:"de"`/`"ar"` via the API body or MCP `set_language` — reliable now.
2. **Escalate to Together:** report the large-v3 auto-detect/translate regression (same audio, opposite result across Jul 21→23).
3. **Consider** pinning a model version if Together offers one, or A/B an alternative multilingual model (note: Arabic coverage constrains alternatives — see intel).

## Out of scope / honest limits
- True in-meeting **code-switching** across ar+de+en: no Together model does it reliably today (whisper covers the languages but mis-detects; Parakeet/Nova-3-multi handle EU code-switching but not Arabic). Pin the dominant language; treat "multi" as beta.
