# Milestone v1.0.0 — Project Summary

**Generated:** 2026-10-25
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

**my-opencode-project** — конфигурационный скелет для OpenCode (агентская среда): настройки агента, права доступа, навыки, тесты и документация. Прикладного кода нет, кроме демо-страницы `calculator.html` (HTML+CSS+JS одним файлом).

Milestone **v1.0.0 «GSD Experiment: About-line»** — учебный прогон полного GSD-цикла (@opengsd/gsd-core v1.18.0) на изолированной мини-фиче: строка «Калькулятор v1.0.0» в подвале калькулятора + синхронизация документации. Ядро ценности: пройти полный жизненный цикл (plan → execute → verify → UAT → security → milestone) **без риска для конфигурации** — `opencode.json`, permissions/policies и плагин объявлены out of scope и не тронуты (проверено scope-fence на каждом шаге).

## 2. Architecture & Technical Decisions

- **Двухслойная проверка фичи** — структурный Vitest (тесты по байтам файла) + Playwright e2e в реальном Chrome (`getByTestId`). Why: разметка и рендер проверяются независимо. Phase 1.
- **Версия — single source of truth из package.json** — `readFileSync`+`JSON.parse` в обоих тестовых слоях, без литералов. Why: фраза «v1.0.0» будет дрейфовать с релизами. Phase 1.
- **Гварды против хардкода** — WR-01 fix: `toBeLessThan(65)` на счётчик числовых литералов в structure-тесте; Phase 2: "119" banned вне dated-записей журнала. Phase 1/2.
- **Динамический counter-gate** — verify-скрипт парсит «Tests N passed» из живого `npm test` и сверяет число во всех трёх доках. Why: главный дрейф (устаревший «119/23» в доках) для будущих релизов теперь ловится автоматически. Phase 2.
- **Threat model в каждом плане (ASVS L1)** — docs-only фазы получают честный State-B short-circuit вместо подделанного «полного» аудита; `threats_open: 0` фиксируется в SECURITY.md. Phase 1/2.
- **Открытая среда OpenCode** — субагентам недоступен `gsd_run` CLI; расхождение протокола декларируется в SUMMARY (STATE/ROADMAP правились файлово), не обходится молча. Experiment observation.

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 1 | About-line footer + two-layer tests | ✅ Complete (verified 5/5, UAT 5/5) | Footer «Калькулятор v1.0.0» в подвале демо-калькулятора, проверенный двумя независимыми слоями тестов (Vitest по байтам файла + Playwright в реальном Chrome), с вычислением версии из package.json и закоммиченным перегенерированным скриншотом |
| 2 | Documentation sync | ✅ Complete (verified 6/6, UAT 6/6) | README и docs/about.md описывают about-line и его проверку `npm run test:ui`, счётчики тестов во всех доках динамически сверены с живым `npm test` (123 = 18+27+51+27), в docs/memory.md записаны dated-записи и раздел «GSD-цикл (эксперимент)» |

## 4. Requirements Coverage

Все 7 требований closed (REQUIREMENTS.md архив: `.planning/milestones/v1.0.0-REQUIREMENTS.md`):

- ✅ **FOOTER-01** — about-line разметка (footer, data-testid, data-version) в последнем ребёнке `<main class="calculator">`
- ✅ **FOOTER-02** — структурный тест: наличие, семантика, формат, sync с package.json — без хардкода (guard)
- ✅ **FOOTER-03** — UI e2e в реальном Chrome: `getByTestId("about-line")` виден, текст содержит версию, JS-ошибок нет
- ✅ **FOOTER-04** — скриншот `docs/screenshots/e2e-calculator.png` перегенерирован и закоммичен
- ✅ **DOCS-01** — README упоминает about-line и способ проверки (`npm run test:ui`)
- ✅ **DOCS-02** — docs/about.md описывает фичу, счётчики AGENTS.md актуальны
- ✅ **DOCS-03** — docs/memory.md: раздел «GSD-цикл (эксперимент)» + dated-записи

Code review итоги: Фаза 1 — 1 WR + 3 INFO (WR fixed); Фаза 2 — 1 WR + 1 IN (оба fixed той же сессией). Security: обе фазы — SECURITY.md с `threats_open: 0` (ASVS L1).

## 5. Key Decisions Log

| Decision | Phase | Outcome |
|----------|-------|---------|
| Учебная задача «about-line» вместо реального бэклога | init | ✓ Реализована, verify passed |
| 2 фазы: фича → документация, coarse-granularity | planning | ✓ Обе complete за один день каждая |
| Наблюдения GSD — в `docs/memory.md`(журнал) + NOTES.md | planning | ✓ Поток NOTES → memory-refactor в Фазе 2 |
| Динамический counter-gate вместо литералов | Phase 2 plan | ✓ Воспроизведён верификатором |
| Pre-check решения: drift-warn / no-context / skip-research | Фазы 1 и 2 | ✓ Осознанно, изложено SUMMARY |
| State-B security short-circuit для docs-only | Фазы 1 и 2 | ✓ Задокументировано, честный при 0 установок |
| GSD-эксперимент не задевает security-конфиг | Project | ✓ Scope-fence подтвердил |

## 6. Tech Debt & Deferred Items

- **FOOTER-05** — muted-оформление about-line (var(--muted), малый шрифт, центрирование) → deferred to v2 (STATE.md → Deferred Items)
- **ITEM-19 бэклог** — `.gitattributes`, автофикс-правила ESLint: осознанно не предмет эксперимента
- **Codebase re-map** — 8 drifted элементов (эхо Фаз 1+2); `/gsd-map-codebase` отложен до конца цикла — осознанный экономический выбор (не гонять маппера дважды)
- **CLI-доступность субагентов** — `gsd_run` недоступен изнутри субагентов в OpenCode-среде: STATE/REQUIREMENTS обновлялись файловыми правками executor'а (расхождение декларировано в SUMMARY, не замолчено)
- **PowerShell-канал** — кириллица в выводе ломается, `&&` не поддерживается → тестовые гейты описаны ASCII-only node -e командами; заметка для будущих прогонов
- Ретро-уроки (RETROSPECTIVE.md): динамическая верификация живого источника; честные short-circuit'ы документируются по месту; находки ревью живут в disposition-ledger

## 7. Getting Started

- **Репозиторий клонировать:** `git clone https://github.com/HeleonoraQA/my-opencode-project.git && npm install`
- **Запуск тестов:** `npm test` (123 теста Vitest: 18 config + 27 structure + 51 e2e + 27 plugins)
- **UI e2e:** `npm run test:ui` (1 Playwright-спек, Chrome channel)
- **Линтер:** `npm run lint` (автоматически в pre-commit хуке)
- **Где смотреть первую середину фичи:** `calculator.html` (footer at line 179), `tests/structure.test.js` (describe "calculator page" lines 49–74), `tests/ui/calculator.spec.js`
- **Документация по фиче:** `README.md`, `docs/about.md`, история — `docs/memory.md`
- **Планировочный артефакт:** `.planning/MILESTONES.md` (итоги) + `.planning/milestones/v1.0.0-*` (архив ROADMAP/REQUIREMENTS/фаз)

---

## Stats

- **Timeline:** 2026-10-18 → 2026-10-25 (7 дней)
- **Phases:** 2 / 2 complete
- **Commits:** 92 (на момент тега v1.0.0); за milestone-прогон: ~35, Com topics + commit-range `feat(calculator)` → `docs(02) evolve project context`
- **Files changed:** 76 files (+8,676 / −10)
- **Contributors:** HeleonoraQA / Heleonora (одна персона — эксперимент)

## GSD-эксперимент: итоги

## GSD-эксперимент: итоги

Полный GSD-цикл отработал честно на обеих фазах: каждая прошла через planner-checker (с ревизией), исполнение атомарными коммитами, code review с disposition ledger и фиксами в той же сессии, верификацию живыми гейтами, UAT (5/5 и 6/6) с человеко-оцениваемыми coverage-чекпоинтами, security-обзор ASVS L1 (`threats_open: 0` на обеих фазах) и phase.complete. Главный урок: гейты, сверяющие живой источник (`npm test`), различают дрейф и ложные зашитые копии лучше, чем сверка текста с текстом.
