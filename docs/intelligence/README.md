# Minutes — Intelligence & Learning

Working intelligence and post-investigation learnings for the zaki-minutes engine. These are
**internal reference / strategy notes** — not part of the published docs site (`docs/docs`), the same
way `docs/adr/` holds decisions rather than user docs.

Origin: the July 2026 "non-English meetings transcribe as English" investigation, which turned out to
be an **external provider regression** (not our code) and produced a shipped mitigation plus a competitive
and codebase intelligence sweep.

## Index

| Doc | What it is |
|---|---|
| [multilingual-root-cause-and-fix.md](multilingual-root-cause-and-fix.md) | The dossier: why non-English meetings showed as English (Together `whisper-large-v3` auto-detect regressed externally — identical audio+invocation, German→English across two dates, zero code change on our side), the evidence chain, the fix (meeting language selection), and a dormant-feature audit. |
| [competitor-landscape-2026.md](competitor-landscape-2026.md) | 16-product AI-notetaker landscape (Otter, Fireflies, Fathom, tl;dv, Avoma, Fellow, Grain, Sembly, Circleback, Granola, Read.ai, Supernormal, Notta, Jamie, + OSS Vexa/Meetily/Hyprnote/Recall): features, pricing, multilingual UX, and the gaps a self-hostable, API-first, Arabic-capable product can exploit. |
| [meeting-language-plan.md](meeting-language-plan.md) | The phased implementation plan for language selection (auto-detect default + per-meeting pick; account default + live switch as follow-ups). |
| [meeting-language-execution.md](meeting-language-execution.md) | The task breakdown executed to ship the fix. |

Shipped mitigation: **PR #37** (`feat(minutes): meeting language selection`) — lets a user pin the
language for a **monolingual** non-English meeting so auto-detect can't silently fall to English. It does
**not** fix true in-meeting code-switching (ar+de+en): pinning one language suppresses the others, so a
trilingual meeting still depends on the external provider getting auto-detect right (treat "multi" as beta —
see [meeting-language-plan.md](meeting-language-plan.md)). The root cause is external (Together `whisper-large-v3`
auto-detect), so #37 is a control surface, not a cure.

## Key learnings

1. **Never trust a provider's silent auto-detect for a correctness-critical field.** Together's
   `whisper-large-v3` flipped German→English between two dates with zero change on our side; the same
   audio re-probed later returned English. Auto-detect is a coin-flip we can't control.
2. **The fix was a UI gap, not a pipeline rewrite** — `language` was already plumbed end-to-end
   (API → invocation → STT client); it was just never set. Pinning it transcribes correctly every time.
3. **A swappable STT seam would insulate us from provider regressions** — Recall.ai and Attendee ship
   BYO/swappable STT for exactly this reason. Worth an abstraction seam.
4. **Arabic-capable multilingual + self-host is a differentiation lane** — the closed-SaaS field is
   English/EU-centric (Supernormal dropped Arabic), and none of the 14 commercial products self-hosts.
5. **Debugging discipline paid off** — the first three hypotheses (audio-capture dropout, English
   `initial_prompt` bias, forced-`en`) were all disproven by evidence before the real cause (provider
   regression) was found. Reproduce and disprove before fixing.
