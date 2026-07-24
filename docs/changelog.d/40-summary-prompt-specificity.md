- **Meeting summaries are now specific, not generic.** The summary system prompt (`SUMMARY_SYSTEM`
  in `collector/summarizer.py`) was tuned to name the real people, products, features, tools and
  numbers as spoken — instead of flattening them into vague phrases like "various tools" — to open
  the TL;DR with the meeting's kind and purpose (demo / pitch / planning / status, plus funding or
  timeline context), and to keep Key points concrete. The faithfulness guard is unchanged: it still
  must never invent facts, names, decisions or dates that are not in the transcript, and it still
  responds in the meeting's own dominant language. Prompt-string only — no logic or output-contract
  change (the `## TL;DR / ## Key points / ## Decisions` sections are the same). Takes effect on the
  next engine image rebuild + chart repin (owner-gated deploy).
