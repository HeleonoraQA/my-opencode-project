---
last_mapped_commit: 9a94b186f4c59c0c28f93abac5ab68e3c3aa1441
last_mapped_at: 2026-10-25
---
# Testing Patterns

**Analysis Date:** 2026-10-25

## Test Framework

**Runner:**
- Vitest 3 (`"vitest": "^3.0.0"`) — all non-UI tests: `tests/*.test.js`, `tests/e2e/*.test.js`
- Playwright Test 1.64 (`@playwright/test`) — UI e2e only: `tests/ui/calculator.spec.js`
- Config files: `vitest.config.js` (excludes `tests/ui/**` so Playwright specs never run under Vitest) and `playwright.config.js` (testDir `./tests/ui`)

**Assertion Library:**
- Vitest's built-in `expect` for unit/config/e2e-semantics tests
- `@playwright/test`'s `expect` with web-first `toHaveText`/`toHaveTitle` assertions for UI

**Run Commands:**

```bash
npm test          # Vitest run over tests/ (UI excluded)
npm run test:watch  # Vitest watch mode
npm run test:e2e  # Vitest run scoped to tests/e2e/ (permissions semantics)
npm run test:ui   # Playwright test (starts fixture server itself)
npm run lint      # ESLint (also runs as pre-commit / in CI before tests)
```

## Test File Organization

**Location:**
- Separate `tests/` directory, not co-located with source. Source (`src/permissions.js`) and plugin (`.opencode/plugins/lint-and-guard/index.js`) have no adjacent test files.
- Three tiers by directory: `tests/` (config + plugin + structure), `tests/e2e/` (permission-rule integration semantics against the real `opencode.json`), `tests/ui/` (browser e2e)

**Naming:**
- `*.test.js` for Vitest, `*.spec.js` for Playwright — do not mix the suffixes

**Structure:**

```
tests/
├── config.test.js      # opencode.json shape: schema, permissions, policies, MCP
├── plugins.test.js     # lint-and-guard plugin: hooks, protected paths, lint queue
├── structure.test.js   # repo layout: required files exist; HTML fixture sanity
├── e2e/
│   └── permissions.test.js  # evaluate() against real permissions+policies
└── ui/
    ├── calculator.spec.js   # Playwright browser scenario
    └── server.mjs           # tiny static HTTP fixture server (port 8123)
```

## Test Structure

**Suite Organization:**

```javascript
// tests/e2e/permissions.test.js — canonical Vitest pattern
import { describe, expect, it } from "vitest";
import { evaluate, loadPermissions, loadPolicies } from "../../src/permissions.js";

const rules = loadPermissions();
const policies = loadPolicies();
const check = (action, resource) => evaluate(action, resource, rules, policies);

describe("e2e: protected paths are denied at any depth", () => {
  it.each(PROTECTED_PATHS)("denies reading %s", (target) => {
    expect(check("read", target)).toBe("deny");
  });
});
```

**Patterns:**
- Parameterized tests with `it.each` (array form; `%s` interpolation in title) — heavily used in `tests/config.test.js`, `tests/e2e/permissions.test.js`, `tests/plugins.test.js`
- Single shared module-level setup (`describe` loads config once at import time) — no `beforeEach` anywhere in the repo
- Meta-tests: configs are asserted by reading and parsing the actual files (`tests/config.test.js:9-11` reads `opencode.json`; `tests/structure.test.js` asserts required repo files exist via `existsSync` and checks `calculator.html` with regexes)
- Assertion style: strict `toBe` for primitives/effects, `toEqual` / `expect.arrayContaining` / `toContainEqual` for rule arrays, `toMatchObject` for partial object checks, `toThrow(/regex/)` for thrown hook errors

## Mocking

**Framework:** Vitest `vi.fn` + dependency injection (no `vi.mock` module mocking, no `testMocks` plugins)

**Patterns:**

```javascript
// tests/plugins.test.js — fake OpenCode plugin context + injected exec
function fakeContext() {
  const hooks = {};
  return {
    hooks,
    ctx: { tool: { hook: async (name, cb) => { hooks[name] = cb; return { dispose: async () => {} }; } } },
  };
}

async function setupPlugin(options = {}) {
  const exec = vi.fn(async () => {});                 // stub eslint spawn
  const instance = createPlugin({ exec, cwd: ROOT, ...options });  // inject, don't mock
  const { ctx, hooks } = fakeContext();
  await instance.setup(ctx);
  return { instance, hooks, exec };
}
// Invoke registered hooks directly:
await after(hooks, { tool: "edit", status: "completed", input: { filePath: "src/app.js" } });
expect(exec).toHaveBeenCalledWith(["--fix", file], { cwd: ROOT });
```

- Dynamic timing is injected/stimulated, not faked: concurrency test counts active `exec` calls to assert serialized execution using `delay` from `node:timers/promises` (`tests/plugins.test.js:135-155`)
- `process.execPath` is never mutated — `nodeBinary()` is tested as a pure function with sample paths as arguments (`tests/plugins.test.js:173-187`)

**What to Mock:**
- Boundary side effects: child-process spawns (`exec`), the OpenCode plugin host context (`ctx.tool.hook`)
- Configuration is injected as arguments (`createPlugin({ exec, cwd, onError })`), making the whole surface testable without globals

**What NOT to Mock:**
- The real `opencode.json` — `tests/e2e/permissions.test.js` and `tests/config.test.js` deliberately test the live configuration file so config drift fails tests
- The DOM/page in UI tests — always use real locators (`getByRole`, `getByTestId`)

## Fixtures and Factories

**Test Data:**
- Paths lists as module-level constants, shared shape with production `PROTECTED_PATHS`:

```javascript
const PROTECTED_PATHS = [
  ".env", "config/.env", "nested/dir/.env", "secrets/db.json",
  "certs/server.key",  // ...
];
```

(`tests/e2e/permissions.test.js:9-21`)
- Inline arrays inside `it.each` for local parameterization

**Location:**
- No fixture directory; the only browser fixture is the real `calculator.html` at repo root, served by `tests/ui/server.mjs` (a path-traversal-guarded static server defaulting to port 8123)
- Playwright's `webServer` in `playwright.config.js` starts the server, waits for `${baseURL}/calculator.html`, reuses an existing server only when `CI` is unset

## Coverage

**Requirements:** None enforced — no thresholds, no coverage script; `coverage/**` is only referenced in `eslint.config.js` ignores.

**View Coverage:**

```bash
npx vitest run --coverage   # ad hoc; not wired into npm scripts
```

## Test Types

**Unit Tests:**
- Pure-logic scope: glob compilation and permission evaluation helpers exercised indirectly through `evaluate()`/`isProtected()`; no direct unit test file per module, unit-level assertions live inside `tests/plugins.test.js`

**Integration Tests:**
- `tests/config.test.js` + `tests/e2e/permissions.test.js` validate the real production config end-to-end: deny/ask/allow outcomes, last-match-wins ordering, policy layer overriding permissive rules

**E2E Tests:**
- Two meanings coexist — keep them distinct:
  - `tests/e2e/` = Vitest "e2e of the permission rules" (no I/O beyond reading config)
  - `tests/ui/` = real browser e2e via Playwright: one full user scenario covering arithmetic, divide-by-zero error state, keyboard input, and a final screenshot artifact written to `docs/screenshots/e2e-calculator.png` (`tests/ui/calculator.spec.js:57-60`)

## Common Patterns

**Async Testing:**

```javascript
// await hook execution; await expect(...).resolves for promise assertions
async function after(hooks, event) { return hooks["execute.after"](event); }
await expect(after(hooks, { tool: "edit", status: "completed", input: { filePath: "src/app.js" } }))
  .resolves.toBeUndefined();
```

**Error Testing:**

```javascript
// Hook blocking is asserted via throwing:
expect(() => before(hooks, { tool: "read", input: { filePath: ".env" } })).toThrow(/protected/);
// Failure-tolerance: stub exec to reject, assert onError called and no crash:
const exec = vi.fn(async () => { throw new Error("eslint failed"); });
// ...
expect(onError).toHaveBeenCalledOnce();
```

**UI Test Hygiene (prescriptive):**
- Always collect console/page errors and assert `expect(consoleErrors).toEqual([])` at the end of a Playwright scenario (`tests/ui/calculator.spec.js:4-8,55`)
- Use `data-testid` locators (`getByTestId("display")`, `getByTestId("expression")`) and accessible names (`getByRole("button", { name, exact: true })`) rather than CSS selectors

**Testing Rules (project):**
- `lint-and-guard` plugin changes require a session restart to take effect; tests import the plugin directly so they always see current code
- UI Playwright specs are excluded from Vitest by `vitest.config.js` — never add Playwright tests outside `tests/ui/`, never make Vitest pick up `*.spec.js`
- Environment files and keys (`.env`, `*.key`, `*.pem`, `secrets/`) are forbidden reads; the test suite only asserts deny behavior on such paths, never opens them. No `.env`/key files are present in the repo.

## CI

- `.github/workflows/ci.yml` — job `verify` on push (all branches) and PR: Node 22, `npm ci`, then `npm run lint` → `npm test` → `npm run test:ui`
- Husky: `.husky/pre-commit` runs `npm run lint`; `.husky/pre-push` runs `npm run lint && npm test`; `.husky/commit-msg` enforces Conventional Commits (`type(scope): summary`)

---

*Testing analysis: 2026-10-25*
