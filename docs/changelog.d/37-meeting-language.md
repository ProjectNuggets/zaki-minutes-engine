- **Pick your meeting's transcription language, or keep auto-detect (#37).** The bot-start box in the
  terminal now has a language selector — choose a specific language (e.g. German, Arabic) so
  non-English meetings transcribe reliably instead of leaning on the provider's auto-detect, or leave
  it on *Auto-detect* (the default, unchanged behaviour). `POST /bots` already accepts the `language`
  code; see [Send a bot](/how-to/send-a-bot).
- **The STT `task` field is now sent to the transcription service (defaults to `transcribe`).** The
  accepted `task` parameter was previously dropped before it reached the service, so `translate` had
  no effect; it now flows through, and transcription can never silently fall back to translation.
