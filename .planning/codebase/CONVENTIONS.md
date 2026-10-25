---
last_mapped_commit: 9a94b186f4c59c0c28f93abac5ab68e3c3aa1441
last_mapped_at: 2026-10-25
---
# Coding Conventions

**Analysis Date:** 2026-10-25

This is a configuration scaffold for OpenCode — there is no application source code. The only runtime JavaScript is `src/permissions.js` (a permissions matcher), `.opencode/plugins/lint-and-guard/index.js` (an OpenCode V2 plugin), and `tests/ui/server.mjs` (a test fixture HTTP server). All conventions below apply to these files and to new code added to this repo.

## Naming Patterns

**Files:**
- camelCase for JS modules: `src/permissions.js`, `tests/plugins.test.js`
- Test naming: `*.test.js` for Vitest (`tests/*.test.js`, `tests/e2e/*.test.js`), `*.spec.js` for Playwright UI tests (`tests/ui/calculator.spec.js`)
- `.mjs` only where extension matters for a fixture server: `tests/ui/server.mjs`
- kebab-case for plugin/skill directories: `.opencode/plugins/lint-and-guard/`, `.opencode/skills/run-tests/`
- Documentation in lowercase: `rules.md`, `docs/plan.md`, `docs/memory.md`, `docs/about.md`

**Functions:**
- camelCase: `loadPermissions()`, `loadPolicies()`, `compile()` (`src/permissions.js`), `isProtected()`, `targetFiles()`, `nodeBinary()`, `createPlugin()` (`.opencode/plugins/lint-and-guard/index.js`)
- Factory functions that build testable instances use the `createX` prefix with an options object: `createPlugin({ exec, cwd, onError })`

**Variables:**
- camelCase for locals and module state: `defaultConfig`, `matchers`, `execFileAsync`
- UPPER_SNAKE_CASE for exported constant policy data: `BASE_POLICY` (`src/permissions.js:12`), `PROTECTED_PATHS` (`.opencode/plugins/lint-and-guard/index.js:25`)
- Private (non-exported) helpers stay lowercase: `escapeLiteral`, `resourceMatches`, `lintFiles`, `reportError`

**Types:**
- Not applicable — plain JavaScript (no TypeScript, no JSDoc type annotations beyond prose)

## Code Style

**Formatting:**
- No Prettier; formatting consistency comes from review and the single-author history
- Observed style: 2-space indent, double quotes, semicolons always, trailing commas in multiline literals/array/object arguments, max line length ~100 chars
- ESM everywhere — `"type": "module"` in `package.json`, `import`/`export` syntax only, no CommonJS

**Linting:**
- ESLint 9 flat config: `eslint.config.js` (no `.eslintrc`)
- Only two enforced rules, both `error`: `no-unused-vars`, `no-undef`
- `ecmaVersion: 2023`, `sourceType: "module"`, globals `console` and `process` declared readonly
- Ignores: `node_modules/**`, `coverage/**`
- Coverage gap to know about: the config targets `**/*.js` only — `.mjs` files (e.g. `tests/ui/server.mjs`) and `.json`/`.html` files are not linted; the autolint plugin mirrors this with `LINTABLE = /\.js$/i`
- Run as `npm run lint` (exact command only; `npm run lint -- --fix` requires confirmation per `rules.md`)

## Import Organization

**Order:**
1. Node built-ins first, using the `node:` prefix, one named import per submodule: `import { readFileSync } from "node:fs"`, `import { dirname, join } from "node:path"` (`src/permissions.js:1-3`). In `.opencode/plugins/lint-and-guard/index.js:8-10`: `node:child_process`, `node:path`, `node:util` in that order.
2. Relative imports to project code last: `import { compile } from "../../../src/permissions.js"` (`.opencode/plugins/lint-and-guard/index.js:11`)
3. Third-party packages (Vitest / Playwright) declined with named imports in tests: `import { describe, expect, it, vi } from "vitest"`

**Path Aliases:**
- None. All imports are relative paths or `node:` builtins.

## Error Handling

**Patterns:**
- **Throw on contract violations in hooks:** the plugin's `execute.before` hook throws a descriptive error to block protected paths: `throw new Error(`Blocked by lint-and-guard: ${file} is protected (...)`)` (`.opencode/plugins/lint-and-guard/index.js:80-82`)
- **Side-projects reporting, never crashing the host:** lint failures inside the plugin are caught and reported via `console.warn` with a `[lint-and-guard]` prefix so a failing eslint run never breaks the OpenCode session (`reportError`, `.opencode/plugins/lint-and-guard/index.js:109-111`, chained via `queue.then(...).catch(...)`)
- **Promise-based async:** async/await with `promisify(execFile)` replacing callback APIs (`.opencode/plugins/lint-and-guard/index.js:13`); a persistent promise queue serializes concurrent lint runs
- **Silent catch only for expected miss:** the fixture server's `try { readFile } catch { respond 404 }` turns any read failure into a 404 (`tests/ui/server.mjs:27-35`)
- **Fail fast on parse errors:** config loaders do no try/catch — invalid `opencode.json` throws from `JSON.parse` (`loadPermissions`/`loadPolicies`, `src/permissions.js:19-25`)
- Prefer early `return` guards: `if (!FILE_TOOLS.has(event?.tool)) return;`, `if (typeof file !== "string" || file.length === 0) return false;`

## Logging

**Framework:** `console` only (no logging library). console is the only global declared in `eslint.config.js`.

**Patterns:**
- `console.warn` with a bracketed component prefix for runtime failures: `[lint-and-guard] eslint failed: ...`
- `console.log` allowed only in standalone scripts/fixtures: `tests/ui/server.mjs:37` prints the fixture URL
- Structured output (CI hooks, husky messages) prints to stderr with human-readable messages: `.husky/commit-msg:12`

## Comments

**When to Comment:**
- Comments explain *why*, especially OpenCode-specific behavior that would otherwise look wrong: why linting spawns `node` instead of `process.execPath` (`.opencode/plugins/lint-and-guard/index.js:50-53`), why a policy deny is final (`.opencode/plugins/lint-and-guard/index.js:62-66`), why the matcher uses case-insensitive flags on win32 (`src/permissions.js:39`)
- Every exported function gets a short JSDoc block describing purpose and semantics: `/** Compile an OpenCode glob ... to a RegExp. */`, `/** Resolve the effect ... */` (`src/permissions.js`)
- Module-level header comment on the plugin file explaining the module's role
- Inline comments mark non-obvious edge cases: shell patterns ending in `" *"` matching bare commands (`src/permissions.js:51-52`)
- Language: English for source code (`src/`, `.opencode/plugins/`); Russian permitted in test specs, config comments, and husky hooks (`tests/ui/calculator.spec.js`, `vitest.config.js`, `.husky/commit-msg`). Keep code comments in English for source files.

**JSDoc/TSDoc:**
- One-line `/** ... */` summaries on exported functions; multi-line JSDoc for functions with non-obvious platform semantics. No type annotations, no `@param`/`@returns` tags in this repo.

## Function Design

**Size:** Small and single-purpose; the largest function is `evaluate()` at ~11 lines (`src/permissions.js:78-89`). Prefer extracting helpers (`escapeLiteral`, `normalize`, `actionMatches`).

**Parameters:** Options objects for anything with multiple configuration knobs: `createPlugin({ exec = defaultExec, cwd, onError } = {})`. Destructured with defaults inline. Positional params kept to ≤3.

**Return Values:** Return codes as string literals for effects (`"allow" | "deny" | "ask"`), `null` for "no result" (`evaluatePolicy` returns `"deny"` or `null`). Regular `function` declarations for exports, arrow functions for small one-line helpers (`const normalize = (value) => value.replace(/\\/g, "/");`).

## Module Design

**Exports:** Named exports (`export function`, `export const`). A single default export is used where OpenCode requires it (the plugin: `export default createPlugin()` plus named exports for testability, `.opencode/plugins/lint-and-guard/index.js:113`).

**Barrel Files:** None — import directly from concrete file paths.

**Testability pattern (prescriptive):** When a module performs side effects (spawning processes, touching the host), split pure logic (`isProtected`, `targetFiles`, `nodeBinary`) from an injectable factory (`createPlugin`) so tests can stub `exec` without globals or module mocking (`tests/plugins.test.js:28-34`).

## Safety Rules (project-mandated)

- Never read or edit `.env`, `.env.*`, `*.key`, `*.pem`, or anything under `secrets/` — enforced in three layers in this repo: `permissions` and `policies` in `opencode.json`, the `execute.before` hook in `.opencode/plugins/lint-and-guard/index.js`
- Conventional Commits are enforced by `.husky/commit-msg`: `type(scope): summary` with types `feat, fix, docs, chore, refactor, test, ci, build, perf, style` (`Merge`/`Revert` exempt)
- Shell allowlist is intentionally tiny: `git *`, `npm test`, `npm run lint`, `ls *` (see `opencode.json`; `git push` stays `ask`)

---

*Convention analysis: 2026-10-25*
