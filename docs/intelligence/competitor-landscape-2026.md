# AI Meeting-Notetaker Competitive Landscape 2026 — for zaki-minutes

## Market context
- ~75% of professionals use an AI notetaker (2x since 2023); 67% of Fortune 500 deployed. Market ~$623M (2025) → ~$740M (2026) → $3.48B by 2035 (18.75% CAGR). [Laxis]
- **Privacy is the #1 adoption barrier: 73%** cite it; 50% of non-adopters name security; 84% of users change how they speak with a bot present. [Laxis, Bloomberg]
- Rising legal exposure: Otter faces class-action over recording/consent + biometric voiceprints; all-party-consent states = real risk. [Mayer Brown, DataGrail]
- Enterprise now demands SOC 2 II, GDPR/CCPA, no-model-training clauses, retention controls, data residency, bot-free capture.
- **Of 14 commercial products profiled, NONE is open-source or self-hostable — all closed cloud SaaS.** That + API/MCP + genuinely multilingual minutes = zaki's seam.

## Master comparison
| Product | Langs | Detect/Pick/Code-switch | Bot-less? | Cheapest paid (annual) | API/MCP | Self-host/OSS |
|---|---|---|---|---|---|---|
| Otter | 6 | manual/no/**no** | mobile | $8.33 | API (Ent-only) | ❌ |
| **Fireflies** | 100+ | ✅/✅/**✅ word-level (beta, Business+)** | ❌ | $10 | GraphQL+MCP | ❌ |
| Fathom | 38 | ✅/no/no (summary→6 langs) | ✅ Meet | $15 | API | ❌ |
| tl;dv | 30+ | ✅/ext-only/✅ | ext | ~$18 | API | ❌ (EU) |
| Avoma | 60+ | request-gated | ❌ | $19 | API+MCP | ❌ |
| Fellow | ~100 | ✅ auto/claimed | ✅ desktop | $7 | API+Claude | ❌ |
| Grain | 100+ | ✅ auto; live 6, rest post-hoc | ✅ desktop | $15 | API beta | ❌ |
| **Sembly** | 48 | **pick 2 + auto + code-switch(2)** | mobile | $20 | API+MCP | ❌ |
| Circleback | 100+ | ✅ | ✅ | $25 | 1,000+ apps | ❌ |
| Granola | ~10 | auto | ✅ | $14 | API (Ent) | ❌ |
| Read.ai | 16+ (100+ upload) | ✅ | ❌ | $15 | integrations | ❌ |
| Supernormal | 60+ | ✅+dialect | ✅ | $18 | 50+ tools | ❌ |
| **Notta** | 58 | ✅ + **bilingual side-by-side + realtime translate (add-on)** | ❌ | $8.17 | integrations | ❌ |
| Jamie | 100+ | ✅+mixed | ✅ | €25 | integrations | ❌ (EU) |
| **Vexa** ⭐ | 100+ (Whisper) | detect+translate | ❌ server bot | $12 / **free self-host** | REST+WS+**MCP** | ✅ **Apache-2.0** |
| Meetily | Whisper | local | ✅ | free | local | ✅ MIT (26k★) |
| Hyprnote/Anarlog | Whisper/45+ | local | ✅ | free | MCP | ✅ MIT |
| Recall.ai (infra) | 30+ / BYO | — | ❌ | $0.50+$0.15/hr | REST+WS | ❌ |

## Table-stakes (must match)
Auto-join bot (Meet+Zoom+Teams) · diarized transcription · summary+action items **with owners** · searchable transcript+recording · "ask across meetings" chat · multilingual auto-detect · Slack/Notion/calendar/**HubSpot+Salesforce**/Zapier · public API · free + $7–25 paid tiers · SOC2 II/GDPR/no-training.
**zaki/Vexa gaps to close:** Zoom bot (rolling out), bot-less/desktop capture, first-class CRM connectors, security attestations.

## Multilingual deep-dive (zaki's battleground)
Three patterns (Gladia): auto-detect one language · pre-specify languages · **no-declaration code-switching** (frontier; `enable_code_switching`). Hard truths: code-switching is the top failure point (weak models emit gibberish or silently translate — *exactly our Together bug*); real WER degrades 2.8–5.7× in production; async/full-context beats real-time/short-window for accuracy.
Leaders: **Fireflies** (word-level code-switch, beta/Business-gated) · **Sembly** (pick-2 + code-switch) · **Notta** (bilingual + realtime translate, paid add-on). Otter is the clear laggard (6 langs, manual, no translate/code-switch).
**Insight:** language *coverage* (100+) is commoditized; thoughtful mixed-language *UX* is scarce and mostly paywalled/beta. zaki runs Whisper large-v3 + an LLM minutes step → can ship, free & self-hosted: auto-detect + per-meeting pick + code-switching AND **minutes generated in the meeting's language or any target language** (competitors are English-centric — Otter can't translate, Fathom localizes to only 6).

## Gaps zaki can exploit
1. **Self-host / data sovereignty = uncontested moat** — none of the 14 commercial tools self-hosts; privacy is the #1 barrier + active litigation → the answer for healthcare/legal/finance/gov/EU who *can't* adopt cloud notetakers.
2. **Multilingual minutes without a paywall** (code-switch/bilingual/output-language) — our sharpest wedge, and it's our active pain point.
3. **Minutes in any language** — LLM step can localize deliverables; most tools generate English-centric notes.
4. **Developer lane under Recall.ai** — free self-host / $0.30+$0.20 hosted vs Recall $0.50+$0.15, open + MCP.
5. **Self-hosted MCP over data that never leaves your walls** — unique vs cloud-MCP (Fireflies/Avoma/Sembly).
6. **Governance-grade "minutes engine"** — structured decisions/owners/attendance/Robert's-Rules for boards/councils/regulated bodies (vs generic "notes").

## Sources (key)
Laxis State of Meeting Note-Taking 2026; Gladia multilingual/code-switching guide; Bloomberg + Mayer Brown (privacy/legal); Fireflies/Sembly/Notta language docs; Recall.ai 2026 pricing; Vexa.ai. (Full per-product profiles + citations in the research-agent output.)

> Provenance: pricing and quantitative figures (per-seat prices, WER multipliers, market-size/CAGR) are point-in-time, retrieved ~2026-07 from the sources above; treat as directional and re-verify the specific number before quoting it externally. Vendor pricing in particular changes without notice.
