# Roadmap: GSD Experiment: About-line

## Overview

Мини-фича в два этапа: сначала изолированная вертикальная фича — строка «Калькулятор v1.0.0» (about-line) в подвале `calculator.html` вместе с проверками на обоих тестовых слоях (структурный Vitest + UI e2e Playwright) и перегенерированным скриншотом; затем синхронизация документации (README, `docs/about.md`, `docs/memory.md`, счётчики тестов в `AGENTS.md`) с записью наблюдений о GSD-цикле. Конфигурация репозитория, permissions/policies и плагин не затрагиваются — это out of scope эксперимента.

## Phases

**Phase Numbering:**
- Integer phases (1, 2): Planned milestone work
- Decimal phases (N.1, N.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: About-line footer + two-layer tests** - About-line «Калькулятор v1.0.0» в `<footer data-testid="about-line">` внутри `<main class="calculator">` + структурные тесты и UI e2e + перегенерированный скриншот
- [ ] **Phase 2: Documentation sync** - README, `docs/about.md`, `docs/memory.md` и счётчики тестов в `AGENTS.md` актуализированы под фичу + наблюдения о GSD-цикле

## Phase Details

### Phase 1: About-line footer + two-layer tests
**Goal:** Пользователь видит в подвале калькулятора строку «Калькулятор v1.0.0», корректность разметки и рендера гарантирована тестами на обоих слоях (структурный + реальный браузер), артефакт скриншота закоммичен.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOOTER-01, FOOTER-02, FOOTER-03, FOOTER-04
**Success Criteria**
  1. Открытый в браузере калькулятор показывает в подвале `<main class="calculator">` видимый текст «Калькулятор v1.0.0» как последний элемент семантического `<footer data-testid="about-line">`, версия продублирована в машиночитаемом атрибуте (`data-version`)
  2. Структурный тест в `tests/structure.test.js` проходит: футер существует и единственный, текст соответствует формату «Калькулятор vX.Y.Z», ожидаемая версия вычисляется из `readFileSync` `package.json` (не хардкод)
  3. UI e2e в `tests/ui/calculator.spec.js` проходит: `getByTestId("about-line")` видим и содержит актуальную версию; JS калькулятора не изменён; центрированный body-grid не сломан
  4. `npm run lint`, `npm test` и `npm run test:ui` — зелёные; скриншот `docs/screenshots/e2e-calculator.png` перегенерирован и включён в коммит фичи
**Plans**: TBD

Plans:
- [ ] 01-01: TBD (заполняется при `/gsd-plan-phase 1`)
- [ ] 01-02: TBD (заполняется при `/gsd-plan-phase 1`)

**UI hint**: yes

### Phase 2: Documentation sync
**Mode:** mvp
**Goal:** Документация репозитория соответствует новой фиче: о about-line можно узнать из README и `docs/about.md`, счётчики тестов в `AGENTS.md` актуальны, в `docs/memory.md` записаны наблюдения о GSD-цикле.
**Depends on**: Phase 1
**Requirements**: DOCS-01, DOCS-02, DOCS-03
**Success Criteria**
  1. README упоминает about-line и способ проверки (`npm run test:ui`) — человек, открывший репозиторий, понимает фичу и как её прогнать
  2. `docs/about.md` описывает about-line, а счётчики тестов в `AGENTS.md` совпадают с фактическим их числом после Phase 1
  3. В `docs/memory.md` есть раздел с наблюдениями о GSD-цикле (что удобно/неудобно, где дублирует AGENTS.md)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD (заполняется при `/gsd-plan-phase 2`)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. About-line footer + two-layer tests | 0/2 | Not started | - |
| 2. Documentation sync | 0/1 | Not started | - |
