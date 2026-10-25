---
last_mapped_commit: 9a94b186f4c59c0c28f93abac5ab68e3c3aa1441
last_mapped_at: 2026-10-25
---
# External Integrations

**Analysis Date:** 2026-10-25

## APIs & External Services

**AI Agent Tooling:**
- OpenCode V2 (local CLI/binary) — the host agent environment; config, permissions, and policies live in `opencode.json`; agent runtime instructions come from `rules.md`
- Playwright MCP server — browser automation tools for the agent
  - Client: spawned locally by `opencode.json` → `mcp.servers.playwright` via `npx @playwright/mcp@latest` (Chrome, headless, isolated, 120s startup timeout)
  - Auth: none (local process); tool `playwright_browser_run_code_unsafe` is hard-denied via `permissions` in `opencode.json`

**Networking in application code:** None. There are no HTTP client SDKs (no `fetch`, `axios`, etc.) in `src/` or `tests/`; the only HTTP work is a local static file server (`tests/ui/server.mjs`) and local browser automation (`tests/ui/calculator.spec.js`, Playwright MCP).

## Data Storage

**Databases:**
- None. No ORM, driver, or connection strings anywhere in `package.json` or source.

**File Storage:**
- Local filesystem only — Playwright reads fixtures from the repo root via `node:fs/promises` (`tests/ui/server.mjs`); test artifacts land in `test-results/` and `.playwright-mcp/` (gitignored working dirs)

**Caching:**
- None in code. CI caches npm packages via `actions/setup-node` `cache: npm` (`.github/workflows/ci.yml`)

## Authentication & Identity

**Auth Provider:**
- None / Not applicable. No user auth exists — the project is a configuration scaffold with a static demo page (`calculator.html`).

**Authorization (agent-facing, not user-facing):**
- OpenCode permission system in `opencode.json`: `permissions` (last-match-wins glob rules over `read`/`edit`/`shell` MCP/tool actions) matched by `src/permissions.js` (`compile()`, used by `.opencode/plugins/lint-and-guard/index.js`)
- Defense-in-depth policy layer: `policies` (`tool.use` → `deny`) in `opencode.json` for protected paths — policy denials can't be overridden by saved "allow always" consents

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry/GlitchTip/etc.)

**Logs:**
- `console` only: server startup line in `tests/ui/server.mjs`; plugin lint failures logged via `console.warn` (`.opencode/plugins/lint-and-guard/index.js`, `reportError`). ESLint's `eslint.config.js` exposes `console`/`process` as globals.

## CI/CD & Deployment

**Hosting:**
- None — nothing deployed. GitHub is used as the repo host (`github.com/HeleonoraQA/my-opencode-project`)

**CI Pipeline:**
- GitHub Actions — `.github/workflows/ci.yml`: job `verify` on ubuntu-latest (Node 22, `actions/checkout@v4`, `actions/setup-node@v4`, `npm ci`) running `npm run lint`, `npm test`, `npm run test:ui` on every `push` (all branches) and `pull_request`

**Local gates (not CI):**
- Husky: `.husky/pre-commit` (`npm run lint`), `.husky/pre-push` (`npm run lint && npm test`), `.husky/commit-msg` (Conventional Commits regex check, sh + grep)

## Environment Configuration

**Required env vars:**
- None required — everything has defaults:
  - `PW_SLOW_MO` (optional; Playwright `slowMo`, default 0 — `playwright.config.js`)
  - `PORT` (optional; test server, default 8123 — `tests/ui/server.mjs`)
  - `CI` (set by CI; toggles `webServer.reuseExistingServer` — `playwright.config.js`)

**Secrets location:**
- None present. No `.env`/`.env.*` files exist, no `secrets/` directory exists (verified)
- Policy: env files, `*.key`, `*.pem`, and `secrets/` are forbidden reads/edits — enforced three ways: `permissions` + `policies` in `opencode.json` and the `PROTECTED_PATHS` block in `.opencode/plugins/lint-and-guard/index.js`. Never read or quote such files; note existence only.

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None (the only outbound network traffic is npm/npx package fetching and GitHub Actions itself)

---

*Integration audit: 2026-10-25*
