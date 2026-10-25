---
last_mapped_commit: 9a94b186f4c59c0c28f93abac5ab68e3c3aa1441
last_mapped_at: 2026-10-25
---
# Codebase Structure

**Analysis Date:** 2026-10-25

## Directory Layout

```text
[project-root]/
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions: lint + test + test:ui on push/PR
├── .husky/               # Git hooks (pre-commit, pre-push, commit-msg); _/ is husky runtime
├── .opencode/            # OpenCode agent extensions
│   ├── plugins/
│   │   └── lint-and-guard/
│   │       └── index.js  # V2 plugin: path guard (execute.before) + auto eslint --fix (execute.after)
│   └── skills/
│       ├── lint/SKILL.md       # Auto-invoked lint skill (pre-commit)
│       └── run-tests/SKILL.md  # Manual skill: run tests on user command
├── .planning/
│   └── codebase/         # GSD codebase map documents (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE)
├── .playwright-mcp/      # Playwright MCP session artifacts (console logs, page snapshots) — gitignored
├── docs/
│   ├── plan.md           # Project plan
│   ├── memory.md         # Project memory/decisions log
│   ├── about.md          # About documentation
│   └── screenshots/      # UI screenshots and one experiment note (.txt)
├── src/
│   └── permissions.js    # Permission/policy matching engine (only production module)
├── test-results/         # Playwright last-run marker — gitignored
├── tests/
│   ├── config.test.js    # opencode.json shape and rule assertions
│   ├── plugins.test.js   # lint-and-guard plugin unit tests (fake ctx, injected exec)
│   ├── structure.test.js # Repo file inventory + calculator page constraints + skill frontmatter
│   ├── e2e/
│   │   └── permissions.test.js # End-to-end evaluation of real permissions + policies
│   └── ui/
│       ├── calculator.spec.js  # Playwright UI e2e
│       └── server.mjs          # Static server fixture on 127.0.0.1:8123 with traversal guard
├── calculator.html       # Single-file calculator demo (markup + styles + script inline)
├── eslint.config.js      # Flat ESLint config (JS only, no-unused-vars, no-undef)
├── opencode.json         # Central OpenCode V2 config: instructions, permissions, policies, mcp
├── package.json          # Scripts + devDependencies (ESM)
├── playwright.config.js  # Playwright: Chrome channel, port 8123, webServer = tests/ui/server.mjs
├── rules.md              # Hard agent rules, loaded via opencode.json instructions
├── vitest.config.js      # Vitest: excludes tests/ui/**
└── AGENTS.md             # Agent-facing project instructions (structure, commands, conventions)
```

No `.env`/`secrets/` files are present in the repo (existence check only; such files are forbidden reads and denied via `opencode.json`).

## Directory Purposes

**`src/`:**
- Purpose: shared runtime logic that configuration and tests both use.
- Contains: exactly one module, `src/permissions.js` (glob→RegExp compile, `BASE_POLICY`, rule/policy loaders, `evaluate`, `evaluatePolicy`).
- Key files: `src/permissions.js`

**`tests/`:**
- Purpose: Vitest suites for config shape, plugin behavior, repo structure, and permission e2e.
- Contains: `tests/config.test.js`, `tests/plugins.test.js`, `tests/structure.test.js`, plus subdirectories below.
- Key files: `tests/e2e/permissions.test.js` (the canonical permission-semantics verification)

**`tests/e2e/`:**
- Purpose: Vitest-run "end-to-end" permission scenario tests against the real `opencode.json`.
- Contains: `tests/e2e/permissions.test.js` only.

**`tests/ui/`:**
- Purpose: Playwright browser e2e (excluded from Vitest by `vitest.config.js:6`, run via `npm run test:ui`).
- Contains: `tests/ui/calculator.spec.js` (spec) and `tests/ui/server.mjs` (static fixture server, port 8123).
- Key files: `tests/ui/server.mjs` (also reachable manually as a tiny file server for `calculator.html`).

**`.opencode/skills/`:**
- Purpose: agent skills; each skill is a directory with a `SKILL.md` (frontmatter `name` + `description`, validated by `tests/structure.test.js:50-57`).
- Contains: `.opencode/skills/lint/`, `.opencode/skills/run-tests/`.

**`.opencode/plugins/`:**
- Purpose: OpenCode V2 plugins (factory + default export with `id` and `setup(ctx)`).
- Contains: `.opencode/plugins/lint-and-guard/index.js`.

**`.husky/`:**
- Purpose: Git hooks. The three rule files must exist (checked by `tests/structure.test.js:26-28`).
- Contains: `.husky/pre-commit` (`npm run lint`), `.husky/pre-push` (`npm run lint && npm test`), `.husky/commit-msg` (Conventional Commits regex). `.husky/_/` is husky-managed runtime — do not edit.

**`docs/`:**
- Purpose: project documentation and evidence artifacts.
- Contains: `docs/plan.md`, `docs/memory.md`, `docs/about.md`, `docs/screenshots/` (PNG screenshots + one `.txt` experiment note). Structure tests pin the three markdown files (`tests/structure.test.js:15-17`).

**`.github/workflows/`:**
- Purpose: CI definition.
- Key files: `.github/workflows/ci.yml`.

**`.planning/codebase/`:**
- Purpose: GSD-generated codebase maps consumed by planning/execution commands.
- Contains: `STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`.

**`.playwright-mcp/` and `test-results/`:**
- Purpose: tooling artifacts (MCP page snapshots/console logs; Playwright last-run marker).
- Generated: Yes. Committed: No (gitignored, `.gitignore`).

## Key File Locations

**Entry Points:**
- `opencode.json`: startup configuration consumed by the OpenCode runtime (instructions, permissions, policies, Playwright MCP server, plugin discovery).
- `.opencode/plugins/lint-and-guard/index.js`: plugin bootstrap (default export `createPlugin()`).
- `calculator.html`: standalone demo page, open in a browser or served by `tests/ui/server.mjs`.
- `.github/workflows/ci.yml`: CI entry.
- `package.json` scripts: `test` (Vitest), `test:e2e`, `test:ui` (Playwright), `test:watch`, `lint`, `prepare` (husky).

**Configuration:**
- `opencode.json`: central agent config (`$schema: https://opencode.ai/config.json`).
- `rules.md`: hard rules injected as instruction file (referenced at `opencode.json:3`).
- `eslint.config.js`, `vitest.config.js`, `playwright.config.js`: tool configs.
- `package.json`: deps/engines/scripts. `package-lock.json`: lockfile (committed).

**Core Logic:**
- `src/permissions.js`: the permission engine (matchers, evaluators).
- `.opencode/plugins/lint-and-guard/index.js`: guard + auto-lint hooks.
- `calculator.html` (inline `<script>` starting around line 181): calculator state machine (`format`, `inputDigit`, `compute`, `chooseOperator`, `equals`, action dispatch).

**Testing:**
- Unit/config: `tests/config.test.js`, `tests/plugins.test.js`, `tests/structure.test.js`
- Permission e2e: `tests/e2e/permissions.test.js`
- UI e2e: `tests/ui/calculator.spec.js` + `tests/ui/server.mjs`

## Naming Conventions

**Files:**
- Test files: `*.test.js` with lowercase dash-free names, e.g. `tests/config.test.js`, `tests/e2e/permissions.test.js`; Playwright specs use `*.spec.js` (`tests/ui/calculator.spec.js`).
- `.mjs` is reserved for standalone runnable scripts (`tests/ui/server.mjs`); all library/config code is ESM `.js` (`"type": "module"` in `package.json:6`).
- Kebab-case for multi-word plugin dirs and skills: `lint-and-guard`, `run-tests`.
- Skill directive files are always `SKILL.md` inside a `<skill-name>/` directory.
- Root markdown docs are UPPERCASE or fixed names: `AGENTS.md`, `README.md`, `rules.md`.

**Directories:**
- `tests/e2e`, `tests/ui` — lowercase, no camelCase.
- Node built-in imports use the `node:` prefix consistently (e.g. `src/permissions.js:1-3`).

## Where to Add New Code

**New Feature (new agent configuration surface):**
- Config: extend `opencode.json` (permissions/policies/mcp) — then update `tests/config.test.js` and the permission scenarios in `tests/e2e/permissions.test.js`.
- Rules: document any behavioral rule in `rules.md` and `AGENTS.md`; update `docs/memory.md` (project convention: rule changes update AGENTS.md + memory).

**New Permission Pattern:**
- Add the glob in BOTH `permissions` and `policies` arrays of `opencode.json` (read+edit pairs) for protected resources.
- Mirror into `.opencode/plugins/lint-and-guard/index.js` (`PROTECTED_PATHS`, line 25) when the plugin must also block it.
- Add cases to `tests/e2e/permissions.test.js` (`PROTECTED_PATHS` list, lines 9-21) and `tests/config.test.js` (`it.each` sets, lines 36-58).

**New Component/Module (production logic):**
- Implementation: `src/<name>.js` (keep it dependency-free; Node built-ins only). Follow `src/permissions.js` style: exported functions, JSDoc on public API, ESM named exports.
- Tests: `tests/<name>.test.js` (Vitest); behavior-over-config scenarios go to `tests/e2e/`.

**New OpenCode Plugin:**
- Implementation: `.opencode/plugins/<plugin-name>/index.js` with a `createPlugin({...})` factory accepting injectable dependencies (`exec`, `cwd`, `onError`) plus a default-export singleton — copy the structure of `.opencode/plugins/lint-and-guard/index.js:67-113`.
- Tests: `tests/plugins.test.js` pattern (fake context via `ctx.tool.hook` capture).

**New Skill:**
- Implementation: `.opencode/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`) matching its directory name (enforced by `tests/structure.test.js:51-57`).

**New UI Test / Fixture:**
- Spec: `tests/ui/<feature>.spec.js`; keep fixture assets inline or under repo root so `tests/ui/server.mjs` can serve them.
- If the page gains external assets, update `tests/structure.test.js:35-48` constraints intentionally (currently forbids `<script src>` and stylesheet links).

**Utilities:**
- Shared helpers belong in `src/` and must be importable by both tests and `.opencode/plugins/` (relative imports cross that boundary — see `.opencode/plugins/lint-and-guard/index.js:11`).

## Special Directories

**`node_modules/`:**
- Purpose: installed dependencies
- Generated: Yes
- Committed: No (`.gitignore`)

**`coverage/`, `playwright-report/`, `blob-report/`:**
- Purpose: test tooling output
- Generated: Yes
- Committed: No (`.gitignore`)

**`.playwright-mcp/`, `test-results/`:**
- Purpose: MCP snapshots/logs and Playwright run markers
- Generated: Yes
- Committed: No (`.gitignore`)

**`.husky/_/`:**
- Purpose: husky-managed hook runtime
- Generated: Yes (by `husky` on `prepare`, `package.json:8`)
- Committed: Only the user-visible files in `.husky/` root (`pre-commit`, `pre-push`, `commit-msg`) are structural; `.husky/_` is regenerable.

**`.planning/`:**
- Purpose: GSD planning workspace (codebase maps, future phase artifacts)
- Generated: By GSD commands
- Committed: Yes (source of truth for planning context)

**`docs/screenshots/`:**
- Purpose: documentation evidence (UI screenshots, one experiment log)
- Generated: Yes (manually captured)
- Committed: Yes

---

*Structure analysis: 2026-10-25*
