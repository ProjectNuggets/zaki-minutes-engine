- **Pick your meeting's transcription language, or keep auto-detect (#37).** The bot-start box in the
  terminal now has a language selector. Picking a language *forces* single-language decode, so it
  reliably helps a **monolingual** non-English meeting (e.g. an all-German call) that the provider's
  auto-detect had been mis-reading as English. A genuinely **multilingual** meeting should stay on
  *Auto-detect* (the default): forcing one language decodes every window as that language and
  **suppresses the others**, so a single pick makes a mixed-language call worse, not better. The
  owner-reported Arabic+German+English meeting is therefore **not** fixed by picking one language —
  that case depends on auto-detect (and the upstream provider's behaviour), not on this selector.
  Auto-detect stays the default (unchanged behaviour). `POST /bots` already accepts the `language`
  code; see [Send a bot](/how-to/send-a-bot).
- **The STT `task` field is now sent to the transcription service (defaults to `transcribe`).** The
  accepted `task` parameter was previously dropped before it reached the service, so `translate` had
  no effect; it now flows through, and transcription can never silently fall back to translation.
