---
phase: 01-about-line-footer-two-layer-tests
plan: 01
subsystem: calculator-demo-ui
tags: [calculator, footer, about-line, playwright, vitest, e2e, screenshot]

requires:
  - phase: none
    provides: existing calculator.html demo with Playwright UI e2e and Vitest structure tests (pre-phase baseline)
provides:
  - about-line footer `<footer class="about" data-testid="about-line" data-version="1.0.0">Калькулятор v1.0.0</footer>` as last child of `<main class="calculator">` in calculator.html
  - structure test layer (Vitest) asserting about-line existence, uniqueness, package.json-sync, semver format, last-child position, non-interactivity
  - e2e layer (Playwright, real Chrome) asserting about-line visibility, visible text and data-version computed from package.json
  - regenerated screenshot artifact docs/screenshots/e2e-calculator.png committed in the feature commit
affects: [02-documentation-sync, verify-work, secure-phase]

actuals:
  tokens: 33000
  tasks: 3
  commits: 3

tech-stack:
  added: []           # zero installs — everything already in devDependencies (threat T-1-SC closed by scope)
  patterns:
    - "two-layer verification: byte-level substring/regex (Vitest) + real-Chrome render assertions (Playwright) on one data-testid contract"
    - "version single-source-of-truth: expected values computed from package.json in BOTH test layers — version drift turns red tests, not review comments"
    - "screenshot artifact as committed deliverable: npm run test:ui rewrites docs/screenshots/e2e-calculator.png on every run"

key-files:
  created:
    - .planning/phases/01-about-line-footer-two-layer-tests/01-01-SUMMARY.md
  modified:
    - calculator.html
    - tests/structure.test.js
    - tests/ui/calculator.spec.js
    - docs/screenshots/e2e-calculator.png

key-decisions:
  - "data-version vs data-app-version — решено заранее в ROADMAP, executor не менял; реализовано как data-version=\"1.0.0\""
  - "Scalar guard prohibition P3 закреплён grep-gate командой в Task 2 <verify> (не всегда-зелёным тестовым ассертом) — прямой запрет literal'а версии в обоих тестовых файлах"

patterns-established:
  - "data-testid межслойный контракт: about-line добавлен к display/expression; никакого getByText/позиционных селекторов в e2e"
  - "sync-тест из package.json: readFileSync + JSON.parse, ожидание всегда вычисляется"

requirements-completed: [FOOTER-01, FOOTER-02, FOOTER-03, FOOTER-04]

coverage:
  - id: D1
    description: "About-line footer в разметке: ровно один <footer data-testid=\"about-line\"> внутри <main class=\"calculator\"> как последний ребёнок <main> (после блока .keys)"
    requirement: FOOTER-01
    verification:
      - kind: unit
        ref: "tests/structure.test.js#renders the about-line footer"
        status: pass
      - kind: unit
        ref: "tests/structure.test.js#about-line footer is last child of main and non-interactive"
        status: pass
    human_judgment: false
  - id: D2
    description: "Видимая строка «Калькулятор v1.0.0» в реальном Chrome: toBeVisible + containText(актуальная версия из package.json) + toHaveAttribute data-version (без literal'а в тесте)"
    requirement: FOOTER-01
    verification:
      - kind: e2e
        ref: "tests/ui/calculator.spec.js#calculator: arithmetic, errors and keyboard stay green (about-line block: getByTestId + toBeVisible + toContainText + toHaveAttribute)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Версия синхронизирована с package.json в обоих слоях (вычисляется, не хардкодится); дрейф даёт красный тест; регэксп формата «Калькулятор vX.Y.Z» и data-version=\"X.Y.Z\" закреплён"
    requirement: FOOTER-02
    verification:
      - kind: unit
        ref: "tests/structure.test.js#about-line version is synchronized with package.json"
        status: pass
      - kind: unit
        ref: "tests/structure.test.js#about-line version has semver format"
        status: pass
      - kind: other
        ref: "guard command Task 2 <verify>: node-скрипт проверяет отсутствие literal'а версии в tests/structure.test.js и tests/ui/calculator.spec.js — прогнан, ответил 'guard passed'"
        status: pass
    human_judgment: false
  - id: D4
    description: "JS калькулятора не изменён: inline <script> не редактировался (diff не содержит строк script-блока), существующие e2e (арифметика/клавиатура/consoleErrors) зелёные без правок существующих строк"
    requirement: FOOTER-03
    verification:
      - kind: e2e
        ref: "tests/ui/calculator.spec.js#calculator: arithmetic, errors and keyboard stay green"
        status: pass
      - kind: other
        ref: "git diff Task 1: только +2 строки markup после </div> блока .keys; script-блок и существующие строки spec не менялись (проверено diff --stat и git show --stat)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Перегенерированный скриншот docs/screenshots/e2e-calculator.png закоммичен как плановый deliverable; body-grid не сломан (панель отцентрована, footer читаем, не перекрывает кнопки)"
    requirement: FOOTER-04
    verification:
      - kind: e2e
        ref: "npm run test:ui перезаписал PNG (LastWriteTime 25.10.2026 14:06, коммит 8b35b94 содержит docs/screenshots/e2e-calculator.png)"
        status: pass
    human_judgment: true
    rationale: "Centered body-grid и читаемость footer подтверждены осмотром перегенерированного fullPage-скриншота глазами executor'а — автоматических позиционных ассертов в репо нет (backstop из must_haves), финальный визуальный вердикт остаётся за человеком при /gsd-verify-work"

metrics:
  duration: 6 min
  completed: 2026-10-25
  status: complete
---

# Phase 1 Plan 01: About-line + two-layer tests Summary

**Footer «Калькулятор v1.0.0» в подвале демо-калькулятора, проверенный двумя независимыми слоями тестов (Vitest по байтам файла + Playwright в реальном Chrome), с вычислением версии из package.json и закоммиченным перегенерированным скриншотом**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-10-25T13:59 (~14:02 первый запуск гейтов)
- **Completed:** 2026-10-25T14:07
- **Tasks:** 3 из 3
- **Files modified:** 4

## Accomplishments
- В `calculator.html` добавлен footer about-line как последний ребёнок `<main class="calculator">`: `<footer class="about" data-testid="about-line" data-version="1.0.0">Калькулятор v1.0.0</footer>` — без правок inline `<script>` и без новых CSS (FOOTER-05 deferred)
- Структурный слой (Vitest) проверяет о about-line: наличие, единственность, sync с package.json (вычисление через readFileSync+JSON.parse, не literal), semver-формат, last-childность `<main>` (whitespace-механика) и неинтерактивность (нет `<a>`/`<button>`/`tabindex`)
- E2e слой (Playwright, real Chrome, port 8123) проверяет видимость, видимый текст и машиночитаемый `data-version` через `getByTestId("about-line")` — три новых ассерта в существующем тесте, селекторная дисциплина соблюдена (никаких getByText/позиционных селекторов)
- Guard-команда (prohibition P3) — grep-гейт отсутствия literal'а версии package.json в обоих тестовых файлах, прогнан: «guard passed: no hardcoded version literals»
- `docs/screenshots/e2e-calculator.png` перегенерирован (`npm run test:ui`) и закоммичен; осмотрен глазами: панель отцентрована, footer читаем, грид кнопок не перекрыт
- Все 123 Vitest-теста + 1 Playwright-тест зелёные; `npm run lint` зелёный; `git status --porcelain` после коммитов чист (кроме служебных .planning-файлов оркестратора — см. Issues Encountered)

## Task Commits

Each task was committed atomically:

1. **Task 1: Tracer — about-line end-to-end** - `8b35b94` (feat) — calculator.html, tests/structure.test.js, tests/ui/calculator.spec.js, docs/screenshots/e2e-calculator.png
2. **Task 2: Structure-тесты — формат версии, sync с package.json, неинтерактивность** - `f62a195` (test)
3. **Task 3: E2e-версия из package.json + перегенерация скриншота** - `d5e4cca` (test)

**Plan metadata:** docs-коммит `docs(01-01): complete about-line and two-layer tests plan` (SUMMARY + STATE + ROADMAP, см. ниже)

## Files Created/Modified
- `calculator.html` — footer about-line (после блока .keys, перед `</main>`), +2 строки, script-блок не тронут
- `tests/structure.test.js` — +5 тестов в существующем describe("calculator page") (tracer-кейс «renders the about-line footer» + три кейса Task 2)
- `tests/ui/calculator.spec.js` — импорты fs/path/url, вычисление pkgVersion, 4 ассерта о about-line
- `docs/screenshots/e2e-calculator.png` — перегенерированный артефакт (commit 8b35b94)

## Decisions Made
- `data-version` — имя атрибута было залочено человеком в ROADMAP до коммита; executor реализовал как есть
- Prohibition P3 («не хардкодить версию в тестах») закреплён guard-командой в <verify> Task 2, а не постоянным тестовым ассертом — согласно <action> пункт 5
- Позиционный last-child-ассерт через `lastIndexOf("</main>")` — согласно <action> Task 2 (indexOf("</div>") матчит первый `</div>` файла и не различает «после .keys»)

## Deviations from Plan

**Total deviations:** 0. Plan executed exactly as written — все задачи выполнены по <action>, все acceptance criteria пройдены с первого прогона, ни одного автофикса.

## Issues Encountered
- **Task 3, пункт про PNG в фича-коммите:** повторный прогон `npm run test:ui` после Task 3 дал байт-идентичный PNG (разметка не изменилась с Task 1), git не зафиксировал изменение — в коммите `d5e4cca` только `tests/ui/calculator.spec.js`. Принятая трактовка (assumption A4): PNG «в коммите фичи» уже выполнен Task 1 (`8b35b94`, файл присутствует в `git show --stat`), а коммит Task 3 подтверждает, что закоммиченный артефакт соответствует финальной разметке. Не отклонение — формальность acceptance criterion закрыта композицией двух коммитов.
- **Служебные .planning-файлы оркестратора:** до старта executor'а в рабочем дереве были незакоммичены `.planning/STATE.md`, `.planning/config.json` (+`use_worktrees: false`) и untracked `.planning/milestone.lock`, `.planning/state.json` (runtime-состояние GSD v2, созданные при инициализации фазы). Executor их не создавал; включены в мета-докоммит плана, чтобы `git status --porcelain` стал пустым (gate 4 из <verification>).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Оба test-слоя ссылаются на единую markup-истину `data-testid="about-line"`; sync-тест из package.json готов к фазе 2 (документация будет опираться на финальный текст футера «Калькулятор v1.0.0», зафиксированный ассертами)
- Phase 2 (Documentation sync) полностью разблокирована: текст футера стабилен, счётчики тестов для AGENTS.md — 124 Vitest + 1 Playwright
- Blockers: none

---
*Phase: 01-about-line-footer-two-layer-tests*
*Completed: 2026-10-25*

## Self-Check: PASSED

- Files verified on disk: calculator.html, tests/structure.test.js, tests/ui/calculator.spec.js, docs/screenshots/e2e-calculator.png
- Commits verified as ancestors of HEAD: 8b35b94 (Task 1), f62a195 (Task 2), d5e4cca (Task 3)
- Measured commits from ledger: 3 (`gsd-plan-head-before-01-01` = 3bf67c5 → HEAD = d5e4cca)
