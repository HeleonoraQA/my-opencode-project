---
last_mapped_commit: 9a94b186f4c59c0c28f93abac5ab68e3c3aa1441
last_mapped_at: 2026-10-25
---
<!-- refreshed: 2026-10-25 -->

# Architecture

**Analysis Date:** 2026-10-25

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                OpenCode Agent Runtime (external)             │
│   reads `opencode.json` (permissions, policies, mcp)         │
│   and `rules.md` (instructions); executes tool calls         │
├──────────────────┬──────────────────┬───────────────────────┤
│   V2 Plugin      │   MCP Server     │    Skills             │
│ `[.opencode/`    │ `opencode.json`  │ `[.opencode/skills/`  │
│  `plugins/...]`  │  `mcp.servers`   │  `lint, run-tests]`   │
└────────┬─────────┴──────────────────┴───────────┬───────────┘
         │ imports compile()                      │
         ▼                                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Permission Engine (single module)               │
│              `src/permissions.js`                            │
└─────────────────────────────────────────────────────────────┘
         │ verified by tests
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Tests (Vitest) + UI e2e (Playwright) + CI + Husky hooks     │
│  `tests/*`          `tests/ui/*`   `ci.yml`   `.husky/*`     │
└─────────────────────────────────────────────────────────────┘
```

This repository has **no application codebase** in the traditional sense: it is a **configuration scaffold** for the OpenCode agent environment. The architecture is organized around (1) an agent configuration surface, (2) one small permission-matching module that makes that configuration testable, and (3) a single self-contained demo page whose UI is exercised through Playwright.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| OpenCode config | Declares instructions, permission/policy deny rules, shell allowlist, Playwright MCP server | `opencode.json` |
| Rules | Hard agent rules (file access, shell rights, commits), injected into the agent via `instructions` | `rules.md` |
| Permission engine | Glob matcher + last-match-wins evaluation of `permissions` and `policies` | `src/permissions.js` |
| Guard/lint plugin | Defence-in-depth: blocks protected paths on `execute.before`, auto-runs `eslint --fix` on mutated `.js` files on `execute.after` | `.opencode/plugins/lint-and-guard/index.js` |
| Skills | Agent-invocable instructions: auto-lint and manual run-tests | `.opencode/skills/lint/SKILL.md`, `.opencode/skills/run-tests/SKILL.md` |
| Calculator demo | Single-file UI (HTML/CSS/JS inline) used as a stable fixture for UI e2e and MCP Playwright testing | `calculator.html` |
| Config tests | Assert the shape of `opencode.json` (schema, deny rules, shell allowlist, MCP wiring) | `tests/config.test.js` |
| Plugin tests | Unit-test the plugin hooks with a fake tool context and injected `exec` | `tests/plugins.test.js` |
| Structure tests | Assert required repo files exist and calculator page constraints (20 keys, inline favicon, no external assets) | `tests/structure.test.js` |
| Permission e2e tests | Evaluate real `permissions` + `policies` from `opencode.json` end-to-end | `tests/e2e/permissions.test.js` |
| UI tests | Playwright e2e against a local static server | `tests/ui/calculator.spec.js`, `tests/ui/server.mjs` |
| Hooks | pre-commit lint, pre-push lint+test, commit-msg Conventional Commits check | `.husky/pre-commit`, `.husky/pre-push`, `.husky/commit-msg` |
| CI | Lint + tests + UI e2e on push/PR (Node 22) | `.github/workflows/ci.yml` |
| Docs | Plan, project memory, about | `docs/plan.md`, `docs/memory.md`, `docs/about.md` |

## Pattern Overview

**Overall:** Config-as-code with a verification harness — the agent runtime's declarative configuration is mirrored by a small, pure matching module and pinned by tests (config-shape tests, behavior e2e tests, structure tests).

**Key Characteristics:**
- **Declarative security layers, defense in depth:** the same protected-path glob set (`*.env`, `*.env.*`, `*secrets/*`, `*.key`, `*.pem`) appears in three places — `permissions` in `opencode.json`, `policies` (`tool.use` denies) in `opencode.json`, and `PROTECTED_PATHS` in `.opencode/plugins/lint-and-guard/index.js`. Policy deny is authoritative and terminal; the plugin hook is a redundant gate.
- **Last-match-wins rules engine:** both permission arrays and policy arrays are evaluated by iterating in order and letting the last matching statement decide (`evaluate()` in `src/permissions.js:78`).
- **No build step, pure ESM:** everything is ES modules (`"type": "module"` in `package.json:6`); tests and tools import source directly.
- **Fixture-driven UI testing:** `calculator.html` is deliberately self-contained (no external scripts/stylesheets, enforced by `tests/structure.test.js:43-47`) and served by a tiny static server for Playwright.

## Layers

**Agent Runtime Configuration Layer:**
- Purpose: define how the OpenCode agent behaves (instructions, tool permissions, MCP servers).
- Location: `opencode.json`, `rules.md`, `AGENTS.md`
- Contains: JSON config (schema `https://opencode.ai/config.json`), markdown rule/instruction files
- Depends on: OpenCode V2 runtime conventions (array `permissions`, `policies`, `mcp.servers.*.command`)
- Used by: the OpenCode runtime at session startup; verified by `tests/config.test.js`

**Guard/Plugin Layer:**
- Purpose: runtime enforcement around tool calls — block protected path access, auto-lint edited JS.
- Location: `.opencode/plugins/lint-and-guard/index.js`; declarative fallback: `.opencode/skills/lint/SKILL.md`
- Contains: V2 plugin (`createPlugin` + hooks `execute.before`/`execute.after`), glob matchers, serialized lint queue
- Depends on: `compile` from `src/permissions.js` (the one production cross-import), Node child_process to spawn ESLint from `node_modules/eslint/bin/eslint.js`
- Used by: the OpenCode runtime (auto-discovered from `.opencode/plugins/`)

**Logic Layer (single module):**
- Purpose: permission/policy evaluation used both as reference semantics and by tests and the plugin.
- Location: `src/permissions.js`
- Contains: `BASE_POLICY`, `loadPermissions`, `loadPolicies`, `compile` (glob→RegExp), `evaluatePolicy` (hard denies), `evaluate` (full resolver)
- Depends on: Node built-ins only (`node:fs`, `node:path`, `node:url`)
- Used by: `tests/e2e/permissions.test.js`, `.opencode/plugins/lint-and-guard/index.js`

**UI Fixture Layer:**
- Purpose: a stable demo UI for UI e2e and interactive Playwright MCP verification.
- Location: `calculator.html` (all markup, styles, script inline; JS logic starts at `calculator.html:181`)
- Contains: display, expression line, 20-key keypad (`data-action`-driven), keyboard support, `compute`/`chooseOperator`/`equals` chain (calculator-style parser-free two-operand evaluation)
- Depends on: nothing external (inline favicon, no `<script src>`, no stylesheet links)
- Used by: `tests/ui/calculator.spec.js` (via static server `tests/ui/server.mjs`), agent sessions via Playwright MCP

**Verification Layer:**
- Purpose: everything test/automation related.
- Location: `tests/` (Vitest: `tests/*.test.js`, `tests/e2e/permissions.test.js`; Playwright: `tests/ui/`), `vitest.config.js`, `playwright.config.js`, `.husky/`, `.github/workflows/ci.yml`, `.opencode/skills/run-tests/SKILL.md`
- Contains: unit/e2e/structure/UI tests and hook scripts
- Depends on: Vitest 3, `@playwright/test` (Chrome channel), Node 22
- Used by: developers, husky hooks, GitHub Actions

## Data Flow

### Primary Request Path (permission decision)

1. Tool call arrives at the OpenCode runtime → runtime consults `permissions` array in `opencode.json` (last-match-wins semantics) plus `policies` hard denies.
2. Before tool execution, the plugin hook `execute.before` (registered in `.opencode/plugins/lint-and-guard/index.js:76-84`) maps tool input paths via `targetFiles` and rejects protected ones through `isProtected` (`index.js:30-34`).
3. If a read/edit of a protected path slipped past config, the `policies` deny still terminates it — modeled by `evaluate()` in `src/permissions.js:78-89` where `evaluatePolicy` overrides any earlier/allow rules (`src/permissions.js:86-88`).

### Edit → Lint Flow

1. Agent mutates a file (`edit`/`write`/`patch`) → hook `execute.after` fires on `completed` (`.opencode/plugins/lint-and-guard/index.js:86-98`).
2. If the target ends in `.js` (`LINTABLE`, `index.js:22`) and is not protected, it is appended to a serialized lint queue.
3. `lintFiles` spawns ESLint `--fix` via the local binary `node_modules/eslint/bin/eslint.js`, choosing `node` from PATH unless `process.execPath` is really Node (`nodeBinary`, `index.js:54-57`); failures are non-fatal (`reportError`, `index.js:109-111`).

### UI Verification Flow

1. `npm run test:ui` → Playwright config launches web server `node tests/ui/server.mjs` on `127.0.0.1:8123` (`playwright.config.js:16-21`).
2. Static server resolves paths under repo root with a traversal guard (`filePath.startsWith(root + sep)`, `tests/ui/server.mjs`), defaults `/` to `calculator.html`.
3. Spec drives the calculator page and asserts behavior (Chrome channel, headless, port 8123 — `playwright.config.js:3-15`).

### Agent Instruction Flow

1. `opencode.json:3` loads `rules.md` as `instructions`; `AGENTS.md` is picked up by the harness automatically.
2. Skills (`.opencode/skills/*/SKILL.md`) are invoked by the agent (`lint` auto via pre-commit, `run-tests` on user command).

**State Management:**
- **No persistent application state.** The runtime is stateless config.
- The plugin holds a module-scoped `queue = Promise.resolve()` promise chain (`.opencode/plugins/lint-and-guard/index.js:68`) to serialize lint runs — the only mutable state.
- Calculator state (`current`, `previous`, `operator`, `display`, `expression`) is closure-scoped inside the page IIFE (`calculator.html:181-325`).

## Key Abstractions

**Glob matcher (`compile`):**
- Purpose: translate an OpenCode glob (V2 semantics: `*` matches any characters including `/`; `?` matches one char) into an anchored RegExp; case-insensitive on Windows only.
- Examples: `src/permissions.js:32-41`, reused by `.opencode/plugins/lint-and-guard/index.js:11` and (`index.js:27`)
- Pattern: single-pass character compiler + `escapeLiteral` whitelist

**Rule evaluation (`evaluate` / `evaluatePolicy`):**
- Purpose: resolve `allow`/`deny`/`ask` for `(action, resource)` pairs under last-match-wins, with terminal policy denies.
- Examples: `src/permissions.js:63-89`
- Pattern: fold over ordered rule array; policy pass afterwards with override authority. Shell pattern `"git *"` also matches bare `git` (special case in `resourceMatches`, `src/permissions.js:52-54`).

**OpenCode V2 plugin:**
- Purpose: hook into tool lifecycle around execution.
- Examples: `.opencode/plugins/lint-and-guard/index.js:67-101` (`createPlugin({ exec, cwd, onError })` factory, injectable for tests), default export singleton (`index.js:113`)
- Pattern: factory + dependency injection; hooks registered via `ctx.tool.hook(name, cb)`

**Action-driven UI:**
- Purpose: calculator buttons carry semantic `data-action` attributes dispatched through an `actions` table.
- Examples: `calculator.html:308-323` (actions map + delegated click listener) and keyboard listener (`calculator.html:325+`)
- Pattern: event delegation + command table

## Entry Points

**OpenCode runtime startup:**
- Location: `opencode.json`
- Triggers: starting/reloading an OpenCode session
- Responsibilities: loads `rules.md` instructions, applies permission/policy matrices, registers the Playwright MCP server (`npx -y @playwright/mcp@latest --browser chrome --headless --isolated`, `opencode.json:44-54`) and auto-loads plugins from `.opencode/plugins/`.

**Plugin bootstrap:**
- Location: `.opencode/plugins/lint-and-guard/index.js:113` (default export `createPlugin()`)
- Triggers: runtime plugin discovery; installs both tool hooks during `setup(ctx)`.
- Responsibilities: path guard + auto-lint (see Edit → Lint Flow).

**Test runners:**
- `npm test` / `npm run test:e2e` → Vitest (`vitest.config.js` excludes `tests/ui/**`) — entry: any `tests/**/*.test.js` / `tests/e2e/permissions.test.js`.
- `npm run test:ui` → Playwright (`playwright.config.js`), server fixture `tests/ui/server.mjs`.
- `npm run lint` → ESLint flat config `eslint.config.js`.

**Static demo page:**
- Location: `calculator.html` (open directly or through `tests/ui/server.mjs`; `/` maps to it)
- Triggers: browser navigation; scripts run inline without any bundling.

**CI workflow:**
- Location: `.github/workflows/ci.yml`
- Triggers: `push` (all branches) and `pull_request`
- Responsibilities: `npm ci` → `npm run lint` → `npm test` → `npm run test:ui` on Node 22, ubuntu-latest.

## Architectural Constraints

- **Single-module logic:** exactly one production module (`src/permissions.js`). No framework, no router, no DB.
- **The one cross-layer import:** the plugin imports `compile` from `../../../src/permissions.js` (`.opencode/plugins/lint-and-guard/index.js:11`) — keep `src/permissions.js` dependency-free (Node built-ins only) to preserve this.
- **Protected paths are triplicated:** changing the secret-glob set requires synchronized updates in `opencode.json` (`permissions`), `opencode.json` (`policies`), `.opencode/plugins/lint-and-guard/index.js:25` (`PROTECTED_PATHS`), and `tests/e2e/permissions.test.js:9-21`. The deny rules in `permissions`/`policies` come as matched pairs (read+edit).
- **Policy deny is authoritative:** per AGENTS.md/docs, a configured `deny` never reaches hooks — never rely on the plugin hook alone for access control; the hook is defence-in-depth (documented at `index.js:59-66`).
- **Windows sensitivity:** glob compilation is case-insensitive on `win32` (`src/permissions.js:39`); path checks normalize `\` → `/` (`src/permissions.js:43`, `index.js:32`). Preserve this when touching matchers.
- **Plugin changes require restart:** edits to the plugin are picked up only after reloading the OpenCode session/app — hooks are not re-registered for hot reloads (see `AGENTS.md`).
- **No TypeScript, no transpilation:** ESM only; ESLint covers `**/*.js` only (flat config in `eslint.config.js`), so non-JS files get no lint — the plugin only auto-lints `.js`.
- **CI pins Node 22** (`.github/workflows/ci.yml:16`); UI tests run in CI with `reuseExistingServer: false`.

## Anti-Patterns

### Reading protected configuration files

**What happens:** Agents may attempt to read `.env`, keys, or `secrets/` contents.
**Why it's wrong:** In this repo those files are hard-forbidden by `permissions` + `policies` in `opencode.json`; attempts fail and break trust-in-depth posture.
**Do this instead:** Note existence only. Mirror any changes to the protected-glob set in all three layers (`opencode.json` `permissions`+`policies`, `.opencode/plugins/lint-and-guard/index.js:25`) and update `tests/e2e/permissions.test.js`.

### Adding a second permission interpretation

**What happens:** Re-implementing permission logic elsewhere instead of reusing `evaluate`/`compile`.
**Why it's wrong:** The matcher in `src/permissions.js` is the verified semantics under test (`tests/e2e/permissions.test.js`); divergence creates untested duplicate behavior.
**Do this instead:** Import from `src/permissions.js` as the plugin already does (`.opencode/plugins/lint-and-guard/index.js:11`).

### Serving calculator from arbitrary paths

**What happens:** Extending the static server to serve any file on disk.
**Why it's wrong:** `tests/ui/server.mjs` intentionally restricts to repo-root-relative paths (traversal guard `filePath.startsWith(root + sep)`) so tests cannot touch unrelated files.
**Do this instead:** Keep new fixtures inside the repo root subtree and extend `contentTypes` only as needed (`tests/ui/server.mjs`).

### Legacy permission object

**What happens:** Using the deprecated singular `permission: {...}` object shape.
**Why it's wrong:** V2 uses the array form; `tests/config.test.js:20-23` explicitly asserts `permissions` is an array and `permission` is undefined.
**Do this instead:** Append array rules respecting last-match-wins ordering (`opencode.json:4-28`).

## Error Handling

**Strategy:** Fail fast in guards, fail soft in lint automation, propagate标准化 errors in tests.

**Patterns:**
- **Throw in hooks (blocking):** protected-path access throws from `execute.before` with an explanatory message (`.opencode/plugins/lint-and-guard/index.js:80-82`).
- **Swallow + report (background):** lint errors are logged with `console.warn` and never block the agent (`index.js:109-111`); errors are normalized via the injected `onError`.
- **HTTP status mapping (static server):** 403 for traversal, 404 for missing files (`tests/ui/server.mjs` catch).
- **Test-level explicitness:** e2e tests assert exact effects (`"deny"`, `"ask"`, `"allow"`) rather than truthiness (`tests/e2e/permissions.test.js:24-49`).

## Cross-Cutting Concerns

**Logging:** `console.warn` for plugin lint failures (`.opencode/plugins/lint-and-guard/index.js:110`); `console.log` for the static server startup message. No logging library.

**Validation:** Config-shape validation lives in `tests/config.test.js` and `tests/structure.test.js`; permission semantics validated in `tests/e2e/permissions.test.js`. No runtime schema validation of user input (no app).

**Authentication:** Not applicable — no server, no users. The closest analog is tool-call authorization (the permission engine itself).

---

*Architecture analysis: 2026-10-25*
