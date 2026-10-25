---
last_mapped_commit: 9a94b186f4c59c0c28f93abac5ab68e3c3aa1441
last_mapped_at: 2026-10-25
---
# Codebase Concerns

**Analysis Date:** 2026-10-25

## Tech Debt

**Protected-path list duplicated across 4 layers:**
- Issue: The set `.env`, `.env.*`, `*secrets/*`, `*.key`, `*.pem` is hand-copied in `opencode.json` `permissions` (lines 5-15), `opencode.json` `policies` (lines 30-39), `.opencode/plugins/lint-and-guard/index.js` `PROTECTED_PATHS` (line 25), plus prose in `rules.md` and `AGENTS.md`. Tests only partially enforce parity: `tests/config.test.js` checks permissions/policies, `tests/plugins.test.js` re-asserts the plugin list independently — there is no single source of truth or cross-layer equality test.
- Files: `opencode.json`, `.opencode/plugins/lint-and-guard/index.js`, `tests/config.test.js`, `tests/plugins.test.js`
- Impact: Adding or renaming a protected pattern requires editing 4+ places; a missed spot silently weakens one defense layer.
- Fix approach: Extract `PROTECTED_PATHS` into `src/permissions.js` (exported constant), have the plugin import it (it already imports `compile`), and add a test asserting `opencode.json` permissions/policies derive from the same constant.

**Platform-dependent case sensitivity in glob matching:**
- Issue: `compile()` in `src/permissions.js:39` sets the RegExp `i` flag only when `process.platform === "win32"`. On POSIX the same matchers become case-sensitive.
- Files: `src/permissions.js`, `tests/e2e/permissions.test.js`
- Impact: Enforcer behavior differs between the Windows dev machine and the Linux CI/any OpenCode server on Linux. E.g. a path `CONFIG/.ENV` matches the deny rules on Windows but not on Linux. Security rules that behave differently per platform are hard to reason about.
- Fix approach: Either always compile case-insensitively (deny rules are about dangerous files, not case-sensitive code paths) or normalize case only for the protected-path patterns; add e2e test cases for uppercase variants.

**Per-file eslint spawn in the plugin lint queue:**
- Issue: `lintFiles()` in `.opencode/plugins/lint-and-guard/index.js:103-107` spawns one `eslint --fix <file>` child process per edited file, sequentially. ESLint already accepts multiple file arguments.
- Files: `.opencode/plugins/lint-and-guard/index.js`
- Impact: Slow for multi-file edits; each spawn ~100-500 ms of Node/ESLint startup.
- Fix approach: Batch the files into a single `exec(["--fix", ...files])` call (tests in `tests/plugins.test.js` will need updating to assert batched calls).

**Monolithic `calculator.html` with inline JS/CSS:**
- Issue: All markup, styles and ~170 lines of logic live in one 353-line file (`calculator.html`). The inline script is not covered by `eslint.config.js` (which handles only `**/*.js`, see `.opencode/plugins/lint-and-guard/index.js:21-22`), so calculator logic gets zero linting and no unit-test harness (only Playwright e2e via `tests/ui/calculator.spec.js`).
- Files: `calculator.html`, `eslint.config.js`
- Impact: Logic regressions can only surface through slow browser e2e; string-based structure assertions in `tests/structure.test.js` substitute for unit tests.
- Fix approach: Acceptable for the project's stated "one-file demo" goal (`AGENTS.md`); if it grows, extract the state machine into a small `src/calculator.js` and keep `calculator.html` as the shell.

**Small dead-code / no-op spots:**
- Issue: `calculator.html:196` contains `.replace("e", "e")` (no-op). `calculator.html:135-138` defines `.key-equals { grid-row: span 1; }` which is a default (grid-row spans 1 row) and does nothing.
- Files: `calculator.html`
- Impact: Cosmetic; suggests copy-paste or leftover experimentation.
- Fix approach: Remove both; `structura.test.js` button/html assertions do not depend on them.

**Floating MCP dependency tag:**
- Issue: `opencode.json:49` runs `@playwright/mcp@latest` via npx. The tool surface (names like `playwright_browser_run_code_unsafe`, the one being denied at `opencode.json:23-27`) can rename/change with any release.
- Files: `opencode.json`
- Impact: The hard deny on a tool name may stop matching after upstream renames; startup depends on network fetch each time.
- Fix approach: Pin a version (e.g. `@playwright/mcp@<x.y.z>`) and re-verify the denied tool name when bumping.

**No `engines` field / broad caret ranges:**
- Issue: `package.json` has no `engines` entry although the codebase requires modern Node (`import.meta.dirname` in `tests/ui/server.mjs:5` needs Node ≥ 20.11/21.2; CI pins Node 22 in `.github/workflows/ci.yml:16`).
- Files: `package.json`, `.github/workflows/ci.yml`
- Impact: A contributor on Node 18 gets a confusing runtime failure instead of an engine warning.
- Fix approach: Add `"engines": { "node": ">=22" }` (or the actual minimum) to `package.json`.

## Known Bugs

**Fractional results break chained arithmetic (decimal comma vs `parseFloat`):**
- Symptoms: After a result with a fractional part is displayed, the next chained operation silently loses precision. Example: `9 ÷ 4 =` → `2,25` (displayed), then `+`, `1`, `=` yields `3` instead of `3,25`. Root cause: `equals()` (calculator.html:293-306) and `chooseOperator()` (calculator.html:278-291) set `current = format(result)`, and `format()` (calculator.html:192-199) replaces `.` with `,`. Every later `Number.parseFloat(current)` (calculator.html:280, 259, 295) stops at the comma — `parseFloat("2,25") === 2`.
- Files: `calculator.html`
- Trigger: Any operation whose displayed result contains a comma, followed by another operator, `percent`, or a second `equals`. The current UI e2e (`tests/ui/calculator.spec.js`) only checks single non-chained fractional results (`9 ÷ 4 = 2,25`), so the bug is not covered.
- Workaround: Press `C` after any fractional result before continuing.

**Digit-limit guard miscounts after computed results:**
- Symptoms: `inputDigit()` counts digits with `current.replace(/[-.]/g, "")` (calculator.html:217) — it strips `-` and `.` but not `,`. After a result like `2,25`, the decimal comma counts as a digit, making the 12-digit limit slightly stricter/unpredictable for continued entry.
- Files: `calculator.html`
- Trigger: Enter a computation producing a decimal (displays with `,`), then keep typing digits.
- Workaround: None (cosmetic-level; interacts with the comma bug above).

**Unknown `data-action` throws instead of ignoring:**
- Symptoms: `calculator.html:322` calls `actions[button.dataset.action]()`; an unknown action name yields `TypeError: actions[...] is not a function`. Currently harmless because all 20 buttons map correctly, but adding a new button with a typo breaks clicks.
- Files: `calculator.html`
- Trigger: A button with `data-action` not present in the `actions` map (calculator.html:308-315).
- Workaround: `if (typeof actions[...] === "function")` guard.

## Security Considerations

**Protected-path deny list is narrower than the recommended secret set:**
- Risk: The deny set covers `.env`, `.env.*`, `*secrets/*`, `*.key`, `*.pem`, but not common secret file types such as `.p12`, `.pfx`, `.jks`, `.npmrc`, `.netrc`, `id_rsa*`, `serviceAccountKey.json`, `*credentials*`.
- Files: `opencode.json`, `.opencode/plugins/lint-and-guard/index.js` (`PROTECTED_PATHS`, line 25)
- Current mitigation: Three defense layers (permissions last-match-wins, hard-deny `policies`, plugin `execute.before` blocking) with test coverage in `tests/config.test.js` and `tests/plugins.test.js`.
- Recommendations: Add the extra patterns once, driven from a single shared constant (see Tech Debt above).

**POSIX case-sensitivity gap in deny matching:**
- Risk: `compile()` applies the `i` flag only on win32 (`src/permissions.js:39`). On a Linux agent/CI, uppercase path variants of protected files would not match deny rules in the matching model this repo ships.
- Files: `src/permissions.js`
- Current mitigation: None beyond the win32 flag.
- Recommendations: Compile protected-path patterns case-insensitively on all platforms, or canonicalize case before matching; add uppercase variants to `tests/e2e/permissions.test.js` (`PROTECTED_PATHS` at line 9-21).

**Plugin guard only covers path-bearing file tools, not shell:**
- Risk: `.opencode/plugins/lint-and-guard/index.js:16` guards `read/edit/write/patch` inputs only; a shell command referencing a protected file (e.g. `cat .env`) is not blocked by the plugin — documented by the test at `tests/plugins.test.js:81-85`.
- Files: `.opencode/plugins/lint-and-guard/index.js`, `opencode.json`
- Current mitigation: Shell default is `ask` (`opencode.json:16`), so any shell command requires human confirmation; there is no shell allowlist pattern that could read files.
- Recommendations: Keep the shell allowlist minimal; do not add `cat *`, `type *`, or similar read commands without deep thought.

**Shell allowlist precision (history of a near-miss):**
- Risk: `git *` allow with last-match-wins previously allowed `git push origin main` until the explicit `git push *` ask rule was added (`opencode.json:18-19`; fix documented in `docs/memory.md`).
- Files: `opencode.json`, `src/permissions.js` (`resourceMatches` special-case for `" *"` suffix, lines 49-56)
- Current mitigation: e2e tests assert push variants stay `ask` (`tests/e2e/permissions.test.js:75-80`).
- Recommendations: Any new allow pattern must get symmetric negative tests in `tests/e2e/permissions.test.js`.

**No secrets present in the repo:**
- Risk: None (audit found no `.env`, `.env.*`, `*.key`, `*.pem`, or `secrets/` files — noted by existence check only, contents never read).
- Files: repository root (checked)
- Current mitigation: `.gitignore` (`node_modules/`, `coverage/`, `.playwright-mcp/`, `test-results/`, `playwright-report/`, `blob-report/`) plus the three deny layers.
- Recommendations: Nothing required; keep secret files out and covered by the deny patterns.

## Performance Bottlenecks

**Sequential per-file eslint in the plugin:**
- Problem: One child process per edited `.js` file (`.opencode/plugins/lint-and-guard/index.js:103-107`); ESLint startup dominates.
- Files: `.opencode/plugins/lint-and-guard/index.js`
- Cause: Files are looped and awaited individually.
- Improvement path: Single `--fix` invocation with all files.

**Executed grammar matching recompiles regexes on every call:**
- Problem: `evaluate()` compiles every rule's glob pattern to a fresh RegExp on each call (`src/permissions.js` `compile`, lines 32-41, via `actionMatches`/`resourceMatches`).
- Files: `src/permissions.js`
- Cause: No caching of compiled patterns (library code here is also a test subject, perf is secondary).
- Improvement path: Memoize `compile(pattern)` in a Map; matters only if used as a hot path in a real permission engine.

**CI runs the Playwright UI suite on every push to every branch:**
- Problem: `.github/workflows/ci.yml:4-6` triggers `npm run test:ui` (Chrome launch + web server) on every push and PR, even doc-only changes.
- Files: `.github/workflows/ci.yml`
- Cause: Single `verify` job, no path filtering.
- Improvement path: Split lint/unit/UI jobs with `paths` filters, or cache Playwright browser installs.

## Fragile Areas

**`opencode.json` permission ordering (last-match-wins):**
- Files: `opencode.json`, `src/permissions.js` (`evaluate`, lines 78-88)
- Why fragile: Rule effects depend entirely on order — the broad `shell: * → ask` must precede `git * → allow`, which must precede `git push`/`git push * → ask`. Reordering silently inverts intent without any error.
- Safe modification: Append-specificity discipline; always re-run `npm test` (`tests/e2e/permissions.test.js` covers ordering) after touching this file.
- Test coverage: Good for current rules (`tests/e2e/permissions.test.js`, `tests/config.test.js`); gap: bare `git` (no args) behavior is not asserted.

**Plugin lifecycle — no hot reload, silent failure mode:**
- Files: `.opencode/plugins/lint-and-guard/index.js`, `.opencode/plugins/lint-and-guard/`
- Why fragile: Edits to the plugin are picked up only after restarting the OpenCode session/app; the reload API re-registers the plugin but does not restore tool hooks (documented in `AGENTS.md` and `docs/memory.md`). Lint failures inside the hook are only `console.warn`ed (index.js:109-111) and never block or surface to the user.
- Safe modification: After any plugin change, restart the session; verify via a deliberate lint error probe.
- Test coverage: `tests/plugins.test.js` (27 tests) covers hook logic and `nodeBinary` resolution; the real OpenCode host integration is only verified manually (via `GET /api/plugin` probes recorded in `docs/memory.md`).

**`nodeBinary` falls back to `node` on PATH:**
- Files: `.opencode/plugins/lint-and-guard/index.js:54-57`
- Why fragile: On a machine where the OpenCode binary is not Node and `node` is missing from PATH, every lint run fails and is swallowed by `reportError` (lines 109-111) — autolint silently stops working.
- Safe modification: Improve `reportError` visibility if editing; add a health check that `node` exists.
- Test coverage: Unit-tested cases for reuse vs fallback (`tests/plugins.test.js:173-187`); the missing-node case is not covered.

**`tests/structure.test.js` literal structure assertions:**
- Files: `tests/structure.test.js`
- Why fragile: Asserts exact counts (e.g. exactly 20 `<button>` elements, line 40) and explicit file lists (lines 10-32); any legitimate layout change must update the test in lockstep or `pre-push`/CI fails.
- Safe modification: Update the count/list with the change in the same commit.
- Test coverage: N/A (it is the test).

**Fixed web-server port 8123:**
- Files: `playwright.config.js:3`, `tests/ui/server.mjs:6`
- Why fragile: Both Playwright webServer and the MCP/server flows assume 8123; a colliding local process makes runs fail. `reuseExistingServer` is disabled in CI (`playwright.config.js:19`).
- Safe modification: Prefer an ephemeral port (port 0) if touching the fixture; keep `PORT` env override.
- Test coverage: CI runs it green (`npm run test:ui` in `.github/workflows/ci.yml:21`).

**`import.meta.dirname` usage:**
- Files: `tests/ui/server.mjs:5`, plus `import.meta.url`-based roots in `src/permissions.js:5`, `tests/*.test.js`
- Why fragile: Requires Node ≥ 20.11/21.2; anywhere else (older Node) it would be `undefined` and paths would resolve wrongly.
- Safe modification: Keep Node version pinning clear (see `engines` debt above).

## Scaling Limits

**Vitest suite / plugin queue:** Not applicable in the classic sense — this is a configuration scaffold with no runtime service. Current load: 119 Vitest checks + 1 Playwright e2e (numbers per `docs/memory.md`), well within limits. The only shared mutable state is the serialized lint queue (`.opencode/plugins/lint-and-guard/index.js:68, 94-97`), which is deliberately single-threaded and bounded by edit frequency.

**Static fixture server (`tests/ui/server.mjs`):** Single-threaded synchronous file reads, bound to 127.0.0.1; fine for e2e fixtures, not usable beyond that. If ever reused for real traffic, add caching and request timeouts — out of scope for this repo.

## Dependencies at Risk

**`@playwright/mcp` (`@latest` tag):**
- Risk: Floating version — new releases can rename tools, change CLI flags (`--browser`, `--headless`, `--isolated`), or alter the denied `playwright_browser_run_code_unsafe` tool name.
- Impact: MCP startup failures or a silently weakened tool deny in `opencode.json:23-27`.
- Migration plan: Pin the version in `opencode.json:49`; bump deliberately with a smoke test (`opencode mcp list`).

**Chrome channel dependency (`playwright.config.js:11`):**
- Risk: `channel: "chrome"` requires Google Chrome at the OS level; GitHub's ubuntu runner image happens to include it, but that is a runner-image contract, not a repo guarantee.
- Impact: CI UI job breaks when the runner image changes or on machines without Chrome.
- Migration plan: Install Chrome in the workflow explicitly (`actions/setup-node` + `npx playwright install --with-deps chrome`) or switch to bundled chromium.

**Caret dev-dependency ranges (`package.json:16-20`):**
- Risk: `eslint ^9`, `vitest ^3.0.0`, `@playwright/test ^1.64.1`, `husky ^9.1.7` — a fresh resolution (without the existing `package-lock.json`) can pick breaking majors/minors.
- Impact: Local experience diverges from CI if people install without the lockfile.
- Migration plan: Lockfile is committed (`package-lock.json`); add `npm audit` to CI or Dependabot-like automation for controlled bumps.

## Missing Critical Features

**No test coverage instrumentation:**
- Problem: `vitest.config.js` sets no `coverage` config; no thresholds, no report artifacts.
- Blocks: Quantifying gaps below; would at least prove the permission engine's real coverage.

**No dependency-security scanning:**
- Problem: No `npm audit` step, no automated dependency update automation anywhere in `.github/workflows/ci.yml`.
- Blocks: Early detection of vulnerable transitive deps (tools like Playwright/Eslint pull large trees).

**No `test:e2e` for the UI in vitest scope separation docs:**
- Problem: `vitest.config.js:6` excludes `tests/ui/**` (correct), but `npm run test:e2e` points at `tests/e2e` only; there is no single command that runs everything local the way CI does.
- Blocks: Pre-push parity — hooks run `npm run lint && npm test` which omits `test:ui`, so a red UI test can reach CI `.github/workflows/ci.yml:21`.

## Test Coverage Gaps

**Fractional chained-arithmetic (the known bug above):**
- What's not tested: `9 ÷ 4 = → + → 1 → =` producing a wrong value (decimal-comma `parseFloat`), `percent()` after a fractional result.
- Files: `calculator.html`, `tests/ui/calculator.spec.js`
- Risk: Real calculator UX silently wrong.
- Priority: High.

**Calculator secondary features:**
- What's not tested: `±` (toggleSign), backspace, `%`, sign/`C` interplay with the `Ошибка` state, keyboard combos (`Shift`, letters beyond `c`).
- Files: `calculator.html`, `tests/ui/calculator.spec.js`
- Risk: Refactors of the inline script regress features unnoticed.
- Priority: Medium.

**Permission engine edge cases:**
- What's not tested: bare `git` (no args) allowance, `?` wildcard behavior, malformed `opencode.json` (loadPermissions throws unchecked — `src/permissions.js:19-21`), policy `allow` effects (silently ignored by `evaluatePolicy` — `src/permissions.js:63-75`).
- Files: `src/permissions.js`, `tests/e2e/permissions.test.js`
- Risk: A future field rename or bad JSON fails in production OpenCode rather than in tests.
- Priority: Medium.

**Plugin/host integration:**
- What's not tested: real OpenCode load (`state.status = "active"`), missing-`node` PATH fallback, plugin restart behavior. Currently verified only by the manual probe protocol in `docs/memory.md`.
- Files: `.opencode/plugins/lint-and-guard/index.js`, `.opencode/plugins/lint-and-guard/`
- Risk: Silent autolint loss (console.warn only).
- Priority: Low (host integration is hard to automate; keep the documented probe procedure).

**UI test artifacts dirty the worktree:**
- What's not tested/noticed: `tests/ui/calculator.spec.js:57-60` writes `docs/screenshots/e2e-calculator.png` on every run; a changed screenshot shows up as a local modification in `git status` and can be committed accidentally.
- Files: `tests/ui/calculator.spec.js`
- Risk: Noise commits of binary artifacts (screenshot bloat already visible in `docs/screenshots/`).
- Priority: Low (either accept and delete stale shots, or write test artifacts outside `docs/`).

---

*Concerns audit: 2026-10-25*
