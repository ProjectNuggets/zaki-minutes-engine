- **Meetings can carry a real title instead of "Meeting N".** The sealed `CaptureRequest` now accepts
  an optional bounded `meeting_title` (1..500, matching the read contract's title), threaded through
  `request_capture` → `_capture_evidence` into the meeting's `data['title']` — the same jsonb the read
  plane's `_title()` already prefers before falling back to the synthesized "Meeting {id}". **No
  migration, no read-plane change; blank/absent keeps the synthesized default.** Back-compatible
  additive reseal *in place* within v1 (no version bump): optional field, `additionalProperties:false`
  preserved, sealed hash recomputed over the merged schema (`contract-version` gate green). Same
  `additionalProperties:false` deploy-order note as the `language` field (#41): this engine reseal must
  deploy before a hub sends `meeting_title`. Pairs with the hub-side title threading (zaki-prod).
