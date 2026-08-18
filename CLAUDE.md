@AGENTS.md
Boot note (2026-08-18): this repository is code only — build, test, publish images. Coordination for the ZAKI deployment of this engine lives in a private operator repo; do not append coordination notes, claims, or handoffs here.

## Claude Code specifics

Layout: pnpm + turbo monorepo — `core/` (gateway, agent, runtime, identity, meetings),
`clients/terminal` (Next.js 15, port 3000, `npm run dev`), `docs/docs` (Mintlify site — the
published law), `calm/` (FINOS CALM model). Licensing is FINOS-gated: new deps must be
Category A (MIT/BSD/Apache); weak-copyleft needs an entry in `license-exceptions.json`
(ADR-0004) — never add GPL/AGPL.
