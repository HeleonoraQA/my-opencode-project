# Stack Research

**Domain:** Single-file vanilla HTML/CSS/JS demo (no build step, no bundler) with Node-based test tooling (Vitest structure tests + Playwright UI e2e) — adding a versioned about-line footer to `calculator.html`
**Researched:** 2026-10-25
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Hardcoded about-line in HTML markup (`<footer>` with `<meta name="application-name">` + `<meta name="version">` + `data-app-version` attribute) | n/a (platform feature) | Single rendered footer "Калькулятор v1.0.0" | This **is** the 2025 standard approach for a version in a no-build static page: metadata goes into standard `<meta>` tags and a visible footer element. No runtime code, works when the file is opened directly, and importable/parseable by tests. Google/MDN docs treat `application-name` as the accepted meta for app identity; a `data-*` attribute gives tests a stable hook. | HIGH |
| `package.json` `"version"` field as single source of truth | existing (1.0.0) | The one place the version is defined | npm's native version home (SemVer, `npm version` bump works out of the box). The repo already has `"version": "1.0.0"`; the feature should mirror it into the page, not invent a second independent source. | HIGH |
| **Sync test** — Vitest structure test comparing HTML meta/attribute against `package.json` | ^3.0.0 (existing, `node:fs` only) | Guarantees the mirror never drifts | Reads `calculator.html` and `package.json` with `readFileSync` (the exact pattern already used in `tests/structure.test.js` lines 36–48), asserts `parseVersion(html) === pkg.version`. Catches the classic failure of hardcoded versions: markup updated, JSON not (or vice versa). Zero runtime deps — `node:fs` is stdlib. | HIGH |
| Playwright UI e2e visibility assertion | ^1.64.1 (existing) | Proves the footer actually renders and is visible | `@playwright/test` already e2e-tests `calculator.html` via `tests/ui/calculator.spec.js` with `getByTestId()` locators. Add `expect(page.getByTestId("about-line")).toBeVisible()` + text check. Real-browser assertion, no DOM-emulation dependency needed. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| None new | — | — | The 'no new dependencies' constraint is *correct*. A version string is data, not functionality; HTML `<meta>`/`data-*` + stdlib `node:fs` cover definition (package.json), transport (HTML), and verification (Vitest + Playwright). Any library that "injects" a version needs a build step this repo explicitly does not have. | HIGH |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| ES module JSON import (`import pkg from "../../package.json" with { type: "json" }`) | Lets the Playwright spec assert the *displayed version* equals `package.json` version without string duplication | Native in Node ≥ 20.10 / 22 (import attributes, stable, unflagged); Vitest 3 supports it. Keep an eye on ESLint flat config parsing if the project lints the test files (`sourceType: module` handles it). | MEDIUM |
| `data-testid="about-line"` on the footer | Stable, locator-tool-friendly hook matching `display`/`expression` convention | Repo already uses `getByTestId("display")` / `getByTestId("expression")` in `tests/ui/calculator.spec.js` — follow the same convention. | HIGH |

## Installation

```bash
# Core — NOTHING to install.
# All needed packages (@playwright/test, vitest, eslint) are already devDependencies:
npm install   # only as a normal project setup step; no new packages added
```

Recommended implementation shape (no code, contract only):

```
calculator.html:
  <meta name="application-name" content="Калькулятор">
  <meta name="version" content="1.0.0">
  ...
  <footer data-testid="about-line" data-app-version="1.0.0">
    Калькулятор v1.0.0
  </footer>

tests/structure.test.js:
  expect(metaVersion(html)).toBe(pkg.version)      // <meta name="version"> == package.json
  expect(dataAppVersion(html)).toBe(pkg.version)   // data-app-version == package.json
  expect(html).toMatch(/data-testid="about-line"/)

tests/ui/calculator.spec.js:
  expect(page.getByTestId("about-line")).toBeVisible()
  ...toContain(`v${pkg.version}`)  // version imported from package.json, not retyped
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative | Confidence |
|-------------|-------------|-------------------------|------------|
| Hardcoded HTML mirror of `package.json` version + sync test | Build-time injection (Vite `define`, esbuild replace, or a tiny Node prebuild script that rewrites the HTML) | Only if the project grows a bundler/build pipeline, so the version has exactly one authored copy. Overkill for a single-file demo; would violate the "single file, no external assets" structure test. | HIGH |
| Hand-edited version string in HTML only (no sync test) | Same as recommended but without the Vitest cross-check | Acceptable only for throwaway pages; drift is inevitable otherwise. The sync test is the cheapest insurance in existence (stdlib-only, ~5 lines). | HIGH |
| `<footer>` text only (no meta tags / data attributes) | Visible footer alone | Fine for pure humans, but makes the version brittle/unfindable for tests and tooling; metadata should be machine-readable, which is the 2025 convention. | MEDIUM |
| `<script type="module">` importing a `version.js` constant | Runtime JS-defined version | Never here: an external `<script src>` breaks the existing structure test (no external assets) and adds a second file to a single-file demo. | HIGH |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Serving/fetching `package.json` from the page at runtime | Client can't read project files; would add an HTTP asset, breaking the single-file constraint and the "no external assets" structure test | Hardcoded HTML metadata + Vitest sync test against `package.json` |
| jsdom / happy-dom for the visibility check | New devDependencies to gain a *fake* DOM when Playwright already runs a real Chrome on this exact file (repo plays `npm run test:ui`) | Existing `@playwright/test` visible-based locator |
| Upgrading Vitest 3 → 5 (current latest 5.0.5) **during this milestone** | Works on Node 22 (engines: `^22.12.0 \|\| ^24 \|\| >=26`), but it's an unplanned upgrade unrelated to the about-line and against the project constraint of touching only the feature files. If the user wants it, do it as a separate task. | Keep `vitest@^3.0.0` for this feature |
| A Web Component / custom element to render the footer | Adds framework-ish architecture and extra lines to a 1-file demo for zero functional gain; harder to assert with a simple testid | Plain `<footer>` element |
| Reading version via `document.querySelector` inside app JS and injecting into the DOM | The file is static; version is known at authorship time. Runtime injection is untestable by the structure test and pointless indirection | Static markup, verified at test time |
| fetching version from GitHub Releases API or any remote endpoint | Network dependency in a demo; violates "no external assets"; fails offline | Local `package.json` as the source of truth |

## Stack Patterns by Variant

**If single-file demo (this milestone):**
- Use hardcoded HTML about-line + `data-app-version` + `<meta name="version">`, all equal to `package.json` `"version"`, enforced by a Vitest sync test
- Because it preserves the no-build, no-external-assets, single-file contract and needs zero new dependencies

**If the project later gains a build step (Vite/bundler):**
- Switch to build-time injection of the version constant instead of hand-mirroring
- Because a build makes single-source-of-truth automatic; the sync test becomes obsolete

**If multiple pages/apps ever appear in the repo:**
- Promote the version to a per-app metadata convention (one `<meta name="version">` per HTML file, one `package.json` per workspace)
- Because per-app versions decouple feature release cycles from repo-wide bumps

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vitest@^3.0.0 (in repo) | node 22 LTS (22.x, latest 22.23.4, EOL 2027-04-30) | `node:fs`, `readFileSync`, JSON import attributes all supported natively — verified against vitest engines and Node release data |
| @playwright/test@^1.64.1 (in repo, latest as of 2026-10-25) | node >= 20 (per npm engines field) | Already newest stable; no upgrade needed. Real-browser test of a static `<footer>` needs nothing new |
| Import attributes (`with { type: "json" }`) | Node ≥ 20.10 / 22.12+, vitest 3 | Stable, unflagged syntax; if the Playwright spec imports `package.json`, ESLint flat config must keep `sourceType: "module"` for `tests/` (already the case) |
| HTML `<meta name="application-name">`, `<meta name="version">` | All modern browsers (Chrome/Edge/Firefox/Safari), no JS needed | These are inert metadata for humans and tooling; `data-app-version` is the actual machine-readable hook used by tests |
| package.json `"version"` 1.0.0 | htmlsync — 1:1 mirror required | The single allowed coupling; the sync test is what makes it safe |

## Sources

- npm registry `@playwright/test/latest` — version 1.64.1, engines `node >= 20` (fetched 2026-10-25) — HIGH
- npm registry `vitest/latest` — version 5.0.5, engines `^22.12.0 || ^24.0.0 || >=26.0.0` (fetched 2026-10-25) — HIGH
- endoflife.date JSON API for Node.js — Node 22 is LTS, latest 22.23.4, EOL 2027-04-30; Node 26 released 2026-05, LTS 2026-10-28 (fetched 2026-10-25) — HIGH
- Local repo inspection: `calculator.html` (structure, inline-only assets), `tests/structure.test.js` (existing readFileSync test pattern), `tests/ui/calculator.spec.js` (existing `getByTestId` + `toBeVisible` pattern), `package.json` (version 1.0.0, existing devDeps) — HIGH
- MDN `<meta name="application-name">` / `data-*` semantics — general web-platform convention, not re-fetched — MEDIUM
- Web search tool returned HTTP 403 on 2026-10-25; registry JSON used as the version ground truth instead — note

---
*Stack research for: single-file vanilla HTML calculator about-line footer (versioned metadata, dependency-free testing)*
*Researched: 2026-10-25*
