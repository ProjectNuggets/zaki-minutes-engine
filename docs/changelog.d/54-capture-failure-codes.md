- **A failed capture now tells you why it failed (#54).** Every failure reported the same generic
  `internal_failure`, whatever had actually gone wrong — a host who never admitted the notetaker, a
  waiting-room timeout, a meeting the bot could not join, a runtime that refused to start it. The
  engine had derived the real cause all along and recorded it against the meeting; the control
  plane simply never translated it into the status API's `failure_code`, so the field carried no
  information and a failed capture could not be diagnosed after the fact. A failed capture now
  reports the specific cause — `join_denied`, `capture_timeout`, `quota_exhausted`,
  `invalid_meeting`, `kicked`, `meeting_ended_early` or `upstream_unavailable` — and a cause that
  genuinely cannot be classified is logged with its raw value rather than disappearing behind the
  generic code. A bot that escalates for help while waiting to be admitted is also no longer
  reported as a failed capture; it is still waiting.
