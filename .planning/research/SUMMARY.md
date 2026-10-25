# Project Research Summary

**Project:** GSD Experiment: About-line
**Domain:** Micro-feature in a single-file vanilla HTML/CSS/JS demo (no build step) inside a tightly-gated OpenCode V2 config-skeleton repo (Vitest structure tests + Playwright UI e2e)
**Researched:** 2026-10-25
**Confidence:** HIGH

## Executive Summary

This milestone adds a versioned about-line footer («Калькулятор v1.0.0») to `calculator.html` — a single-file demo with no build step, no external assets, and an existing two-layer test suite. Experts build this kind of feature with zero new dependencies: static markup (semantic `<footer>` with a `data-testid` hook), mirrored from `package.json`'s version, and verified by cheap string-level structure tests plus one real-browser visibility assertion. Research confirms the repo already has every tool needed (vitest@^3.0.0, @playwright/test@^1.64.1, Node 22 LTS) — installation work is literally zero.

The recommended approach is a hybrid: static visible text in the markup plus a machine-readable `data-app-version`/`data-version` attribute, with a Vitest sync test computing the expected version from `package.json` (never hardcoding it in the test). The footer goes inside `<main class="calculator">` as the last child — not as a sibling of `<main>` — because `body { display: grid; place-items: center }` assumes a single grid child. JS stays untouched: the about-line is purely static markup, and any JS rendering adds failure surface the existing `consoleErrors` e2e assertion would police.

The dominant risks are not technical but layout/scope side effects: breaking the centered body grid, version drift from `package.json`, flaky text-based selectors, uncommitted churn of the committed full-page screenshot, and "green locally, red CI" from lint-blind HTML changes. All are cheap to prevent and are mapped to specific phases below. Stack confidence is HIGH because the feature is dependency-free; the main gap is that no new tooling research was needed — which itself validates the "no new dependencies" constraint.

## Key Findings

### Recommended Stack

Nothing new gets installed — the correct stack is the existing one. (Full detail: [STACK.md](STACK.md).) A version string is data, not functionality: `package.json` `"version"` (1.0.0) is the single source of truth, standard HTML `<meta>`/`data-*` attributes transport it into the page, and stdlib `node:fs` + the existing test runners verify it. Any "version injection" library would require a build step this repo explicitly does not have.

**Core technologies:**
- `package.json` `"version"` field — single source of truth for the version (already present as 1.0.0; SemVer + `npm version` work natively)
- Hardcoded HTML about-line (`<meta name="application-name">` + `data-testid="about-line"` + version attribute) — the standard no-build approach; renders offline, testable as raw bytes
- Vitest structure test (`node:fs`/`readFileSync`) — compares HTML metadata against `package.json`, preventing drift; follows the exact existing pattern in `tests/structure.test.js`
- Playwright UI e2e (`getByTestId` + `toBeVisible`) — proves the footer actually renders in real Chrome; matches existing `display`/`expression` testid conventions

### Expected Features

(Full detail: [FEATURES.md](FEATURES.md).)

**Must have (table stakes):**
- Semantic `<footer>` with a stable selector (`data-testid="about-line"`) — tests at both layers cannot hook onto arbitrary markup
- Text «Калькулятор v1.0.0» — app name + semver version; the only required content
- Structure test asserting footer presence and format — plus version sync against `package.json`
- UI e2e asserting the footer is visible and shows the version
- Restrained styling (muted color via `var(--muted)`, small font, centered) — 1–3 lines of inline CSS
- Documentation updates (README, `docs/about.md`, `docs/memory.md`, `AGENTS.md` test counts) — repo convention, part of the milestone not cleanup

**Should have (competitive):**
- Link to the GitHub repository in the footer — v1.x, first a11y/UX review (must handle the global-keydown interaction caveat)
- `aria-label` / accessibility touches — cheap quality add on first review

**Defer (v2+):**
- License line — blocked on a repo-wide licensing decision
- Single version constant reused by app JS — only if the calculator gains version-sensitive logic
- Build-time version injection / bump scripts — only if the project ever gains a build step

### Architecture Approach

(Full detail: [ARCHITECTURE.md](ARCHITECTURE.md).) The feature is a purely static markup+CSS addition to `calculator.html` — JS layer untouched, no runtime data flow exists. The single file serves three independent consumers: the structure test reads it as UTF-8 text, Playwright renders it in Chrome via the static server on port 8123, and the CI pipeline runs both. Version is authored once in markup but deliberately duplicated (visible text + `data-version` attribute) as a conscious trade-off of the no-build format; a sync test makes the `package.json` coupling safe.

**Major components:**
1. About-line markup + CSS block inside `<main class="calculator">` (after `.keys`) — `<footer data-testid="about-line">Калькулятор v1.0.0</footer>`; last child, preserving body grid centering
2. Structure tests in `tests/structure.test.js` — footer existence, single `<footer>`, version format regex, version == `package.json` (computed, not literal)
3. UI e2e in `tests/ui/calculator.spec.js` — `getByTestId("about-line")` visible + contains version; no interactions
4. Documentation updates (Phase 2) — named list: `AGENTS.md`, `docs/about.md`, `docs/memory.md`, README

### Critical Pitfalls

(Top 5 of 8; full mapping in [PITFALLS.md](PITFALLS.md).)

1. **Footer breaks centered body layout** — `body { display: grid; place-items: center }` expects one child; put the footer inside `<main class="calculator">`, not as a body sibling. Verify with the regenerated screenshot.
2. **Version drift from `package.json`** — never hardcode «1.0.0» in the test; the structure test must *compute* the expected string from `package.json` via `readFileSync`. Drift becomes a red test, not a review comment.
3. **Flaky e2e selector** — repo discipline is `data-testid` (`display`, `expression`); use `getByTestId("about-line")`. No `getByText`, positional CSS, or `exact: true` on visible text.
4. **Lint-blind markup changes / stale server = green local, red CI** — ESLint covers `.js` only, pre-commit runs lint only. Phase done-criteria must include `npm run lint` + `npm test` + `npm run test:ui`; kill stale port-8123 servers; treat CI as authoritative.
5. **Screenshot artifact churn** — the e2e suite rewrites `docs/screenshots/e2e-calculator.png` (fullPage); regenerate and commit it deliberately in the feature commit, listed as a planned deliverable.

Also tracked: keyboard-hijacking footer (keep it non-interactive — the global `keydown` handler swallows Enter on focused links; no `<a>`/`<button>` in v1) and docs/count drift in Phase 2 (test-count updates are in scope of the doc phase).

## Implications for Roadmap

Based on research, suggested phase structure (matches the 2-phase shape already outlined in PROJECT.md):

### Phase 1: About-line footer + two-layer test coverage
**Rationale:** Markup with a stable selector is the dependency root — both test layers and docs consume it; feature and its verifications must land together so the version-sync guard ships with the hardcoded value.
**Delivers:** `<footer data-testid="about-line">Калькулятор v1.0.0</footer>` inside `<main>` with muted centered CSS; structure tests (presence, single footer, version format, sync with `package.json`); Playwright visibility/text assertions; regenerated `docs/screenshots/e2e-calculator.png`.
**Addresses:** All table-stakes features from FEATURES.md (P1 rows of the priority matrix).
**Avoids:** Pitfalls 1–7 — footer placement inside `<main>` (grid intact), computed sync test, `data-testid` selector, test:ui as done-gate, deliberate screenshot commit, non-interactive footer.

### Phase 2: Documentation sync
**Rationale:** Docs depend on the finalized footer text (the wording tests assert is the wording docs describe); repo convention requires `AGENTS.md` + `docs/memory.md` updates when structure or test counts change, and husky does not enforce it.
**Delivers:** Updated `AGENTS.md` (test counts), `docs/about.md` (feature in overview), `docs/memory.md` (GSD-cycle observations), README mention.
**Addresses:** Cross-link-in-docs differentiator (P1 doc row from FEATURES.md).
**Avoids:** Pitfall 8 — treating Phase 2 casually; a named doc list opened from the start.

### Future / post-milestone (not phases of this milestone)
- v1.x: repo link + aria-label in footer (requires deliberate keydown-handler decision for anchors — see PITFALLS.md #7)
- v2+: license line (after repo-level decision), bump automation (only if drift becomes a real burden)

### Phase Ordering Rationale

- **Markup before tests before docs:** A stable `data-testid` selector is a prerequisite for both test layers; final footer text is a prerequisite for docs — dependency graph in FEATURES.md fixes this order.
- **Both test layers in one phase:** String-level and browser-layer tests see the same file bytes; splitting them would let one phase ship with rendering unverified (structure substring proves nothing about visibility).
- **Pitfall placement is front-loaded:** All layout/selector/sync pitfalls are design decisions at markup-write time (Phase 1), not catchable later — Phase 2 carries only the doc-drift pitfall, which is exactly its scope.
- **No third phase needed:** CI, husky hooks, and lint config require zero changes (verified in ARCHITECTURE.md integration points) — there is nothing to build a phase around.

### Research Flags

Phases likely needing deeper research during planning:
- **None.** Both phases use well-documented, already-in-repo patterns.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Feature = static markup + existing test conventions (`readFileSync` pattern, `getByTestId` pattern both precedented in the repo); zero new dependencies.
- **Phase 2:** Documentation edits — no research needed, only a named file list.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency approach; existing package versions verified against npm registry (playwright 1.64.1, vitest 3/5 compat) and Node 22 LTS EOL data on 2026-10-25 |
| Features | HIGH | Footer/about-line conventions are established practice (semver.org, MDN semantics); scope constrained by PROJECT.md |
| Architecture | HIGH | Based on direct reading of `calculator.html`, both test files, CI workflow, and hook config — no inferred components |
| Pitfalls | HIGH | Every pitfall traced to inspected repo facts (body grid, keydown handler, `reuseExistingServer`, screenshot artifact, lint coverage) |

**Overall confidence:** HIGH

### Gaps to Address

- **Web search was unavailable (HTTP 403) on the research date** — version facts were cross-checked via npm registry JSON and endoflife.date API instead; no impact on findings, but re-verify if any upgrade beyond the pinned versions is ever proposed.
- **Exact attribute naming (`data-app-version` vs `data-version`)** — STACK.md and ARCHITECTURE.md disagree slightly on the name; either works (tests are the contract). Resolve in Phase 1 planning by picking one and using it consistently in markup + both test layers.
- **Vitest 3 → 5 upgrade temptation** — latest vitest is 5.0.5 and Node-22-compatible, but upgrading mid-milestone violates the feature-only scope constraint; handle as a separate future task if wanted.
- **E2E-asserting the displayed version against `package.json`** would use JSON import attributes (`import ... with { type: "json" }`, stable on Node ≥ 20.10 / vitest 3) — MEDIUM confidence (flagged for ESLint `sourceType` interplay); simplest fallback is asserting the version already validated by the structure test.

## Sources

### Primary (HIGH confidence)
- npm registry: `@playwright/test/latest` (1.64.1, engines `node >= 20`), `vitest/latest` (5.0.5, engines `^22.12.0 || ^24 || >=26`) — fetched 2026-10-25
- endoflife.date JSON API for Node.js — Node 22 LTS, latest 22.23.4, EOL 2027-04-30; Node 26 LTS 2026-10-28 — fetched 2026-10-25
- Direct repo inspection: `calculator.html` (353 lines: body grid, global keydown, CSS variables, inline-only assets), `tests/structure.test.js` (readFileSync substring pattern), `tests/ui/calculator.spec.js` (testid discipline, console-error assertion, fullPage screenshot), `playwright.config.js` (Chromium/Chrome channel, 1280×800, port 8123, `reuseExistingServer: !CI`), `package.json` (version 1.0.0, devDeps)
- `.planning/PROJECT.md` / `AGENTS.md` / `rules.md` — milestone constraints, allowed-file scope, hook chain (pre-commit lint-only, pre-push lint+test, Conventional Commits), doc-update convention

### Secondary (MEDIUM confidence)
- semver.org — `MAJOR.MINOR.PATCH` format convention
- MDN Web Docs — `<meta name="application-name">`, `<footer>` semantics, `data-*` attributes, `<a rel="noopener">`
- Open-source footer/README convention — name + version + source link as typical minimum set (community consensus)

### Tertiary (LOW confidence)
- JSON import attributes (`with { type: "json" }`) in Node 20.10+/22 with vitest 3 — stable per docs; ESLint parsing interplay needs one-time verification if used

---
*Research completed: 2026-10-25*
*Ready for roadmap: yes*
