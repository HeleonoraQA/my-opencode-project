---
last_mapped_commit: 9a94b186f4c59c0c28f93abac5ab68e3c3aa1441
last_mapped_at: 2026-10-25
---
# Technology Stack

**Analysis Date:** 2026-10-25

## Languages

**Primary:**
- JavaScript (ES2023, ESM) — all source and tooling: `src/permissions.js`, `tests/**`, `tests/ui/server.mjs`, `eslint.config.js`, `vitest.config.js`, `playwright.config.js`, `.opencode/plugins/lint-and-guard/index.js`
- JSON (with shell-flavored scripts) — configuration: `opencode.json`, `package.json`, `package-lock.json`

**Secondary:**
- Shell (sh, 1–15 line scripts) — Git hooks: `.husky/pre-commit`, `.husky/pre-push`, `.husky/commit-msg`
- YAML — CI pipeline: `.github/workflows/ci.yml`
- HTML — single-file demo app: `calculator.html`
- Markdown — docs and rules: `rules.md`, `AGENTS.md`, `README.md`, `docs/*.md`

## Runtime

**Environment:**
- Node.js 22 — pinned in CI (`.github/workflows/ci.yml`, `actions/setup-node` step). No `engines` field in `package.json`; locally any modern Node works, but target 22.
- `"type": "module"` in `package.json` — the whole repo is ESM; use `import`/`export`, not `require`.

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`); CI uses `npm ci` (`.github/workflows/ci.yml`)

## Frameworks

**Core:**
- None — no application framework. This is a configuration scaffold for OpenCode (agent config, permissions, skills, hooks). The only "app" is the static demo page `calculator.html` served by a hand-rolled Node server (`tests/ui/server.mjs`, `node:http`).

**Testing:**
- Vitest ^3.0.0 — unit/config/e2e tests (`tests/config.test.js`, `tests/structure.test.js`, `tests/plugins.test.js`, `tests/e2e/permissions.test.js`); config in `vitest.config.js` (excludes `tests/ui/**`)
- Playwright Test ^1.64.1 (`@playwright/test`) — UI e2e (`tests/ui/calculator.spec.js`); config in `playwright.config.js` (Chrome channel, headless, port 8123, `webServer` boots `tests/ui/server.mjs`)

**Build/Dev:**
- ESLint ^9.0.0 (flat config, `eslint.config.js`) — linting; scripts `npm run lint` / `lint:fix`
- Husky ^9.1.7 — Git hooks (`prepare` script); `.husky/pre-commit` runs `npm run lint`, `.husky/pre-push` runs `npm run lint && npm test`, `.husky/commit-msg` enforces Conventional Commits
- OpenCode V2 — agent runtime configured by `opencode.json` (instructions, permissions, policies, MCP). Plugin `.opencode/plugins/lint-and-guard/index.js` hooks `execute.before`/`execute.after` (auto-lint edited `.js`, block protected paths). Skills in `.opencode/skills/lint/` and `.opencode/skills/run-tests/`
- Playwright MCP server — `mcp.servers.playwright` in `opencode.json` runs `npx @playwright/mcp@latest` (Chrome, headless, isolated); `playwright_browser_run_code_unsafe` tool is denied

## Key Dependencies

**Critical:**
- `@playwright/test` ^1.64.1 — UI e2e runner and Chrome automation (`playwright.config.js`)
- `vitest` ^3.0.0 — test runner for all non-UI tests (`vitest.config.js`)
- `eslint` ^9.0.0 — lint gate used in hooks, CI, and the OpenCode plugin

**Infrastructure:**
- `husky` ^9.1.7 — local Git hook enforcement
- `@playwright/mcp@latest` (fetched via `npx` at MCP startup, not in `package.json`) — browser tools for the OpenCode agent (`opencode.json` → `mcp.servers.playwright`)

All dependencies are devDependencies; there are no runtime production deps.

## Configuration

**Environment:**
- No `.env` files exist in the repo (verified; also `.env` patterns are read/edit-denied by `permissions` + `policies` in `opencode.json` and blocked by the `lint-and-guard` plugin)
- Env vars are read directly by tooling, no dotenv loading anywhere:
  - `PW_SLOW_MO` — Playwright slowMo tuning (`playwright.config.js`)
  - `PORT` — static test server port (default 8123, `tests/ui/server.mjs`)
  - `CI` — switches `webServer.reuseExistingServer` (`playwright.config.js`)

**Build:**
- No build step. Static repo: lint (`eslint.config.js`) + tests (`vitest.config.js`, `playwright.config.js`) + hook/CI assembly.
- OpenCode agent config: `opencode.json` (schema `https://opencode.ai/config.json`); agent instructions loaded from `rules.md` via `instructions` array

## Platform Requirements

**Development:**
- Node.js 22 (match CI), npm
- Google Chrome installed — Playwright uses `channel: "chrome"` (`playwright.config.js`) and Playwright MCP uses `--browser chrome` (`opencode.json`)
- Git with husky hooks active (`npm install` runs the `prepare` script)
- Windows-friendly, POSIX-capable hooks: hooks are sh scripts (`child_process` spawns use `windowsHide: true` in `.opencode/plugins/lint-and-guard/index.js`)

**Production:**
- None — nothing is deployed. CI (`.github/workflows/ci.yml`, `verify` job on ubuntu-latest, Node 22) runs the entire gate: `npm run lint` → `npm test` → `npm run test:ui`.

---

*Stack analysis: 2026-10-25*
