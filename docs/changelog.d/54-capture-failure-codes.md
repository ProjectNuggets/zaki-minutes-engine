- **A failed capture now tells you why it failed (#54).** Every failure reported the same generic
  `internal_failure`, whatever had actually gone wrong. The engine had derived the real cause all
  along and recorded it against the meeting; the control plane simply never translated it into the
  status API's `failure_code`, so the field carried no information and a failed capture could not be
  diagnosed after the fact. A failed capture now reports the specific cause — `join_denied`,
  `capture_timeout`, `quota_exhausted`, `invalid_meeting`, `kicked`, `meeting_ended_early` or
  `upstream_unavailable` — and a cause that genuinely cannot be classified is logged with its raw
  value rather than disappearing behind the generic code.
- **A notetaker nobody let in now says so.** Every measured failure was the same thing: the notetaker
  reached the meeting's waiting room and no one admitted it, so after several minutes it gave up.
  Those captures are now reported as "nobody admitted the notetaker" rather than as an unexplained
  fault on our side — which had also been advising a retry that fails the same way. A capture the
  user cancelled while the notetaker was still waiting outside is reported the same way instead of
  claiming the meeting had ended, and a capture really stopped by its length limit keeps the
  maximum-length message that was previously being given to notetakers that captured nothing.
- **A notetaker that asks for help while it waits is no longer reported as a failed capture.** It is
  still waiting.
