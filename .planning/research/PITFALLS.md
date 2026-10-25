# Pitfalls Research

**Domain:** Micro-feature (footer about-line) added to an existing single-file HTML demo in a tightly-gated config-skeleton repo (ESLint flat config, Husky, Conventional Commits, Playwright Chrome channel, GitHub Actions UI tests)
**Researched:** 2026-10-25
**Confidence:** HIGH (based on direct inspection of `calculator.html`, `playwright.config.js`, `tests/ui/calculator.spec.js`, `tests/structure.test.js`, `package.json`, CI and hook config described in `AGENTS.md`)

## Critical Pitfalls

### Pitfall 1: Footer breaks the centered body layout

**What goes wrong:**
`calculator.html` uses `body { display: grid; place-items: center; min-height: 100vh }` with `<main class="calculator">` as the only child. Adding the about-line as a second direct child of `<body>` (a `<footer>`) makes it a second grid item: the two items stack in implicit rows, the calculator stops being vertically centered, and the footer sits flush against it with no design. The "one-line change" silently serves a visibly broken layout — but there is **no structural e2e assertion** on positioning, so local dev and CI can both stay green.

**Why it happens:**
Developer thinks "footer → new element at the end of body" without reading the CSS grid on `<body>`. `place-items: center` only visually works with a single grid child.

**How to avoid:**
Insert the about-line **inside** `<main class="calculator">` (as the last block inside the panel) or introduce an explicit wrapper column. Keep the calculator's own centering intact. Take a full-page screenshot before/after to eyeball the result.

**Warning signs:**
Reviewing the edited `calculator.html` locally shows the calculator paddling upward/downward or clamped to the top; the page screenshot (`docs/screenshots/e2e-calculator.png`, `fullPage: true`) regenerates with an obviously different composition.

**Phase to address:**
Phase 1 (feature implementation) — this is a design decision at the moment of writing the markup, not something tests will catch later.

---

### Pitfall 2: Footer text overflows or wraps badly in the mobile viewport

**What goes wrong:**
The panel is `width: min(360px, 100%)`; the page is tuned for 1280×800 in `playwright.config.js`. An about-line like «Мой калькулятор · версия 1.0.0 · ссылка на репозиторий» will wrap onto multiple lines or overflow the panel at 320–360 px. Em dashes, `·` separators and long repo URLs are the usual culprits. If a responsive assertion is later added at a mobile viewport, it flakes or fails.

**Why it happens:**
All existing tests use the default 1280×800 viewport; nobody looks at narrow widths when adding one short line.

**How to avoid:**
Style the about-line from day one: `text-align: center`, small muted font (`var(--muted)`), `word-break/overflow-wrap: break-word` if any URL appears, no fixed `white-space: nowrap` unless the text is short enough at 320 px. Optionally verify at a 360×640 viewport locally.

**Warning signs:**
Line wraps mid-word or the panel grows wider/scrollbar appears at narrow width; text with a URL extends beyond the panel edge.

**Phase to address:**
Phase 1 — CSS for the footer is part of the feature, add the narrow-viewport check in the same phase.

---

### Pitfall 3: Version string drifts from package.json

**What goes wrong:**
`package.json` says `"version": "1.0.0"`. Hardcoding «1.0.0» into `calculator.html` guarantees drift: any future bump changes the npm version but not the footer (or vice versa). In a repo whose whole purpose is demonstrable conventions, a stale version in the demo prose is exactly the kind of inconsistency the structural tests are supposed to police.

**Why it happens:**
Hardcoding is the path of least resistance for a "tiny feature". Projection of a single human's intent to keep two numbers in sync manually.

**How to avoid:**
Add a structural test that reads `package.json` (`readFileSync` — the pattern already used in `tests/structure.test.js`) and asserts the version substring in `calculator.html` matches it. That makes drift a red test, not a review comment. Do not inline a build script to inject the version — that adds machinery the constraint "only touch calculator.html + tests + docs" forbids.

**Warning signs:**
A structure test with a hardcoded `«1.0.0»` expectation instead of a computed one (inherently unable to detect drift); a reviewer can grep for `"1.0.0"` in `tests/` to spot this early.

**Phase to address:**
Phase 1 — the sync test ships together with the about-line, written against `package.json` as the single source of truth.

---

### Pitfall 4: Flaky e2e selector for the about-line

**What goes wrong:**
The existing UI spec selects strictly by role/aria-label and `data-testid` (`getByTestId("display")`, `getByRole("button", { name, exact: true })`). A new assertion on the footer written as `page.getByText(/версия/)` or a CSS selector `.footer span:last-child` will break on the first copy change or re-markup — the classic "text selector, text moved, test red" flake. Using `exact: true` against visible text also breaks if punctuation/spacing differs slightly (`·` vs `•`, NBSP).

**Why it happens:**
For a one-line element a locator-by-text feels natural; the test author doesn't follow the repo's own established selector discipline.

**How to avoid:**
Give the about-line `data-testid="about-line"` in the markup and assert on it (`getByTestId`), optionally plus `toHaveText` with the full exact string including the version sourced from `package.json`. Keep the selector style consistent with `display`/`expression`.

**Warning signs:**
A new Playwright locator that contains literal visible text (`getByText`, `text=`, `:has-text(`) or positional CSS (`nth-`, `last-child`) instead of a `data-testid`.

**Phase to address:**
Phase 1 — the e2e check and its selector pattern are written in the same commit as the markup.

---

### Pitfall 5: Existing e2e test breaks in subtle ways when the run rewrites its artifacts

**What goes wrong:**
The single UI spec ends by saving `docs/screenshots/e2e-calculator.png` (`fullPage: true`). Adding a footer changes this committed binary artifact. Consequences seen in practice: unexplained git-diff noise (a PNG of several hundred KB churns on every run), a confusing first commit ("feat: footer" includes a screenshot refactor), and on CI the regenerated local PNG can pixel-differ from the committed one (font antialiasing across runner/OS), creating accidental binary churn even when the markup is unchanged.

**Why it happens:**
The screenshot is a side effect everyone forgets exists because no test asserts on it.

**How to avoid:**
Regenerate and commit the screenshot deliberately in the feature commit; treat the committed PNG as a doc artifact that is updated only when the page changes. Do not add screenshot-diffing assertions on top of it in this phase (that's a separate decision with its own flake budget).

**Warning signs:**
`git status` shows `docs/screenshots/e2e-calculator.png` modified after merely loading the page; a CI diff containing a PNG the phase plan never mentions.

**Phase to address:**
Phase 1 — regenerate/commit the artifact in the feature commit; the plan should list the PNG as an expected deliverable.

---

### Pitfall 6: Markup and inline-JS changes are invisible to lint — only `test:ui` catches them, and only in CI

**What goes wrong:**
ESLint covers `.js` only (the plugin run auto-fixes changed `.js` files, not HTML). Inline `<script>` inside `calculator.html` is therefore never linted, and a markup typo (unclosed tag, broken attribute) fails neither `npm run lint` nor husky `pre-commit` (lint-only). The failure surfaces in `npm test`'s 51 e2e Vitest checks (substring assertions) or — for behavior — in `npm run test:ui`, which runs in GitHub Actions on the Chrome channel but is frequently skipped locally. Classic signature: green locally, red CI.

**Why it happens:**
Developers trust "lint passed = page fine" — but here lint genuinely cannot see the file that changed.

**How to avoid:**
Treat `npm run test:ui` as **mandatory** before declaring the UI phase done (the repo's own verification rule says exactly this — follow it even for a one-liner). Locally check the page once in a browser. Note `reuseExistingServer: !process.env.CI`: a stale server on port 8123 from an earlier experiment makes local runs green against old code — kill port 8123 or rely on CI as the source of truth.

**Warning signs:**
Something was changed in `calculator.html` without a warnable artifact (no test touched); local `npm test` green while describing a UI change; a leftover node server on 8123 before the run.

**Phase to address:**
Phase 1 verification gate — the phase plan should explicitly name `npm run lint` + `npm test` + `npm run test:ui` as the phase's done criteria.

---

### Pitfall 7: A keyboard-hijacking footer (link inside the footer breaks keyboard accessibility)

**What goes wrong:**
The document-level `keydown` handler captures `Enter` and calls `event.preventDefault()` before running `equals()`. If the about-line becomes a focusable element (e.g., a link to the repo), plain Enter on a focused link is swallowed by the calculator logic — the link can't be activated at all with a keyboard. Conversely, adding any key-mapped character to the footer's text is fine, but copy like «©2026, [repo name]» doesn't hurt; interactives do. The e2e suite's `consoleErrors === []` assertion also turns any footer-linked external resource (font, badge, tracking) into a hard red if it fails to load in CI's offline-ish environment.

**Why it happens:**
The global key handler is invisible when you're looking only at the bottom of the body markup.

**How to avoid:**
Keep the footer **static**: plain text, no `<a href>`, no `<button>`, no interactive element. If a link is required later, it must exclude itself from the global handler (`event.target.closest('a')` early-return) — defer that to a deliberate decision, not a side effect of the about-line.

**Warning signs:**
Any `<a`, `<button>`, `tabindex` in the planned footer markup; a footer that would load external resources (badge images, web fonts) — the CI console-error assertion will surface it as an intermittent failure.

**Phase to address:**
Phase 1 implementation review — explicit self-check "footer is non-interactive, loads no external resources" before commit.

---

### Pitfall 8: Documentation and structure-test count drift

**What goes wrong:**
The repo documents counts and structure: `AGENTS.md`/`docs/memory.md` describe the test base (119 Vitest + 1 UI e2e), `tests/structure.test.js` asserts literal substrings of `calculator.html` (`'id="display"'`, `'rel="icon"'`). Adding the about-line plus a structure test changes those counts and possibly untouched-looking assertions. The repo convention requires updating `AGENTS.md` and `docs/memory.md` when structure changes — this is commonly skipped for a "one-line feature", and husky doesn't enforce doc updates.

**Why it happens:**
Doc updates feel disproportionate to a one-line change; the convention covers only the cases you remember.

**How to avoid:**
Budget the doc changes into Phase 2 from the start (they're not cleanup): update test counts, mention the about-line, add the `docs/memory.md` observation entries. Check whether any of the 23 structure tests share the touched literal context (e.g., end-of-`<main>` content).

**Warning signs:**
Phase 2 opens with "just edit README" instead of a named list (AGENTS.md, docs/about.md, docs/memory.md, README.md, committed screenshot prose); structure test suite edited in Phase 1 but counts left stale in docs.

**Phase to address:**
Phase 2 (documentation) — that is precisely this phase's scope; the pitfall is Doing Phase 2 Too Casually.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode version «1.0.0» in markup and (optionally) in test | One line, zero code | Drift from `package.json` on first bump; sync is undetectable if the test hardcodes it too | Never — the sync test is 3 lines |
| Reuse the existing single e2e test and append footer assertions into it | No new file/pattern decisions | Mixes independent concerns; a footer failure fails the whole calculator scenario | Acceptable for this milestone; split only if it grows |
| Skip narrow-viewport check ("it's a demo") | Faster | Layout breakage invisible until first real mobile look | Acceptable only if the footer CSS is defensively simple (centered, muted, break-word) |
| Skip regenerating the committed screenshot | No thinking about artifacts | PNG churn in unrelated commits, confusing diffs | Never — one deliberate regeneration in the feature commit |
| Text-based locator for the footer | No markup change needed (`data-testid` omitted) | Red test on first copy/wording change | Never — the repo already has the `data-testid` discipline |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Playwright `webServer` (port 8123) | Stale server from previous run is reused locally (`reuseExistingServer: !CI`), so you test against old markup | Ensure no leftover process on 8123; treat CI as authoritative for UI changes |
| GitHub Actions (Chrome channel, `test:ui`) | Declaring done after local Vitest only; local behaves differently (fonts, port reuse) | Phase verification includes `npm run test:ui`; read CI result before marking phase verified |
| Husky `commit-msg` | Non-Conventional message rejected late, after lint ran (`type(scope): summary` only) | Draft the message first: `feat(calculator): add about-line footer` |
| Husky `pre-commit` / `pre-push` | Assuming pre-commit runs tests — it runs lint only; pre-push runs lint+test | Plan the local verification step explicitly, don't rely on the hook |
| ESLint + lint-and-guard plugin | Expecting lint to validate HTML/inline JS — it covers `.js` only | HTML validity is gated by substring structure tests + console-error e2e; add a structure test for the tmp footer |
| `docs/screenshots/e2e-calculator.png` | Footer lands in the screenshot and the PNG churns in git | Regenerate + commit deliberately in the feature commit |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Growing `calculator.html` with per-feature CSS blocks | CSS organization degrades, duplicate selectors | One small commented block `/* about-line */`; reuse `var(--muted)` | Noticeable at ~2+ features; keep the block minimal here |
| Screenshot artifact size growth | PNG diff bloat in repo | Keep footer one line of text; no gradients/images in footer | Immediate once images/emoji-heavy markup enter the footer |
| Adding external resources (fonts, badges) to footer | CI test:ui slower and network-dependent; console-error red | Footer loads zero external resources | Immediately on any offline/CI environment |
| Structure test suite becoming substring soup | One markup rename breaks N tests | Assert `data-testid="about-line"` once, not surrounding markup | At ~30+ substring assertions (already 23) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Temptation to "improve" security config while in there (opencode.json, plugin) | Explicitly out of scope; violates repo rule | Scope of edits: `calculator.html`, `tests/`, `docs` only; reviews must reject other diff |
| Footer link to GitHub repo with full URL | Offline test/client sends requests (minor); URL in markup rots on repo rename | Keep footer static text; if a link is later needed, handle it deliberately (see Pitfall 7) |
| Putting an email/contact in the footer | Scraping, then maintenance rot | Don't — the about-line spec is name + version only |
| Inserting third-party badge/counter snippets in footer | External JS in a demo file; console errors in e2e | Keep the demo self-contained like the rest of the file (inline SVG favicon pattern) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Footer is brighter/stronger than the panel content | Attention pulled from the calculator | Muted color (`var(--muted)`), small font size (12–13 px) |
| Footer lacks contrast against dark background | Unreadable for low-vision users | Verify contrast of `--muted`-colored text on `--panel`; bump to a lighter tone only if needed |
| Text crammed against key grid margin | Visually attached to the last key row | Margin/padding top ≥ 16 px, centered |
| Footer reflows on narrow screens into 2–3 ragged lines | Sloppy look at 360 px | Short text («Имя · версия 1.2.3»), `text-align: center`, no nowrap |
| Non-localized mixed-language footer (EN version in RU UI) | Inconsistent with `lang="ru"` page | Keep RU wording, stable format «Калькулятор · версия X» |

## "Looks Done But Isn't" Checklist

- [ ] **About-line markup:** Present and visible — assert `data-testid="about-line"` exists in a structure test **and** its Playwright visibility check passes (structureSubstring alone proves nothing about rendering)
- [ ] **Version sync:** Footer version matches `package.json` — verified by a structure test that *computes* the expected string from `package.json`, not from a literal
- [ ] **Layout intact at 1280×800 and ~360 px:** Calculator still centered; footer doesn't shift it — eyeball the regenerated `docs/screenshots/e2e-calculator.png` + one narrow-viewport check locally
- [ ] **Zero console errors:** The e2e `consoleErrors` assertion still passes with footer markup — run `npm run test:ui`, don't assume
- [ ] **Screenshot artifact:** `docs/screenshots/e2e-calculator.png` regenerated and committed in the feature commit
- [ ] **Docs:** `AGENTS.md`, `docs/about.md`, `docs/memory.md`, README updated; test counts corrected
- [ ] **Commit discipline:** Conventional message format; lint+test green before commit (pre-commit runs lint only!); push deliberately gated by user permission
- [ ] **Scope isolation:** Diff touches only allowed files (no `opencode.json`, no plugin, no config) — list expected files in the phase plan and diff against it

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Footer breaks body centering (Pitfall 1) | LOW | Move element inside `<main>.calculator` or add wrapper; re-run test:ui; regenerate screenshot |
| Selector flake (Pitfall 4) | LOW | Add `data-testid`, replace text/positional locator, re-run full spec |
| Version drift discovered later (Pitfall 3) | LOW | Fix value, land computed structure test in same commit — one `fix(calculator): sync footer version with package.json` + `test(...)` |
| CI red after "green local" (Pitfall 6) | MEDIUM | Read CI log (usually console error / missing element); kill stale 8123 server; reproduce locally with `npm run test:ui`; if not reproducible — check Chrome channel/font differences |
| Screenshot churn (Pitfall 5) | LOW | One chore commit regenerating + committing the PNG; document in `docs/memory.md` |
| Keyboard-accessibility regression (Pitfall 7) | MEDIUM | Remove link or add early-return in keydown for anchors; add sr-only/readable fixup; re-run e2e keyboard scenario |
| Docs/count drift found at the end (Pitfall 8) | LOW | Docs-only commit `docs: update test counts and about-line mention` |
| Security-scope leak (touched opencode.json by accident) | HIGH | Revert commit; notify user; re-verify permissions layer; log observation in `docs/memory.md` |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Body-grid centering broken | Phase 1 (feature) | Visual check + regenerated screenshot; optional narrow-viewport manual look |
| 2. Mobile viewport overflow/wrap | Phase 1 (feature CSS) | Local 360×640 check; footer CSS uses muted/break-word |
| 3. Version drift from package.json | Phase 1 (structure test) | Structure test computes expected string from `package.json` |
| 4. Flaky footer selector | Phase 1 (UI e2e) | e2e uses `data-testid="about-line"`; no text/positional locators |
| 5. Screenshot artifact churn | Phase 1 (feature commit) | PNG present in the same commit; plan lists it as deliverable |
| 6. Lint-blind markup changes, stale-server false-green | Phase 1 (verification gate) | Plan «done» criteria = `npm run lint` + `npm test` + `npm run test:ui`; CI green |
| 7. Non-interactive footer / global keydown hijack | Phase 1 (implementation review) | Markup review: no `<a>`/`<button>`/`tabindex`; e2e keyboard scenario unchanged |
| 8. Docs & count drift | Phase 2 (documentation) | Named doc list edited (AGENTS.md, docs/about.md, docs/memory.md, README); counts match the new suite |

## Sources

- Direct repo inspection: `calculator.html` (body grid, global keydown handler, muted/panel palette), `playwright.config.js` (Chrome channel, 1280×800, port 8123, `reuseExistingServer: !CI`), `tests/ui/calculator.spec.js` (role/testid selector discipline, console-error assertion, fullPage screenshot to `docs/screenshots/`), `tests/structure.test.js` (substring-based HTML assertions, `readFileSync` pattern), `package.json` (`"version": "1.0.0"`)
- `.planning/PROJECT.md` — milestone constraints (files allowed to change, verification rules, out-of-scope security surfaces)
- `AGENTS.md` / `rules.md` — hook chain (pre-commit lint-only, pre-push lint+test, `commit-msg` Conventional Commits), doc-update convention, `git push` gate

---
*Pitfalls research for: footer about-line micro-feature in my-opencode-project*
*Researched: 2026-10-25*
