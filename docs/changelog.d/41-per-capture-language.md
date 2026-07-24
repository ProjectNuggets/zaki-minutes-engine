- **Per-capture meeting language accepted over `zaki-control.v1`.** The sealed `CaptureRequest`
  contract now carries an optional `language` (BCP-47 short code, `^[a-z]{2}(-[A-Z]{2})?$`), threaded
  through the control router into `request_capture`; the capture service already forwarded a
  `language` to the bot/STT, it just had no way in from the hosted control plane. **Absent = auto-detect
  (unchanged).** Back-compatible additive reseal *in place* within v1 (no version bump): the field is
  optional, `additionalProperties:false` is preserved, old producers stay valid, and the sealed hash
  was recomputed (`contract-version` gate green). This is the reliable fix for *single-language*
  meetings that Whisper auto-detect mis-transcribed; per-utterance code-switching remains a separate
  item. **Deploy order:** because the contract validates inbound with `additionalProperties:false`, this
  engine reseal must deploy before the hub picker starts sending `language` — an older engine rejects an
  unknown field (422). Pairs with the hub-side meeting-language picker (zaki-prod #172).
