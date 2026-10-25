# Requirements: GSD Experiment: About-line

**Defined:** 2026-10-25
**Core Value:** Пройти полный GSD-цикл без риска для конфигурации репозитория: изолированная мини-фича (about-line в подвале калькулятора) с проверками в тестах и обновлением документации.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Footer (about-line)

- [x] **FOOTER-01**: Пользователь видит в подвале калькулятора строку «Калькулятор v1.0.0» — семантический `<footer data-testid="about-line">` как последний дочерний элемент внутри `<main class="calculator">`, версия отражена в видимом тексте и в машиночитаемом атрибуте (`data-version`)
- [x] **FOOTER-02**: Структурный тест в `tests/structure.test.js` гарантирует: футер существует, `<footer>` ровно один, текст соответствует формату «Калькулятор vX.Y.Z», версия синхронизирована с `package.json` (ожидание вычисляется через `readFileSync`, не хардкодится)
- [x] **FOOTER-03**: UI e2e в `tests/ui/calculator.spec.js` подтверждает реальный рендер: `getByTestId("about-line")` видим и содержит актуальную версию; JS калькулятора не изменяется
- [x] **FOOTER-04**: Скриншот `docs/screenshots/e2e-calculator.png` перегенерирован и закоммичен в коммите фичи как плановый артефакт

### Docs

- [x] **DOCS-01**: README упоминает about-line и как её проверить (запуск `npm run test:ui`)
- [x] **DOCS-02**: `docs/about.md` и счётчики тестов в `AGENTS.md` актуализированы под новую фичу
- [x] **DOCS-03**: В `docs/memory.md` записаны наблюдения о GSD-цикле (что удобно/неудобно, где дублирует AGENTS.md)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Footer (about-line)

- **FOOTER-05**: Приглушённое оформление строки (muted-цвет через `var(--muted)`, малый шрифт, центрирование)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Ссылка на GitHub в футере | Differentiator вне v1; требует обхода global-keydown-ловушки (Enter сваливается) |
| Aria-label / a11y-штрихи | Differentiator вне v1; достаточный минимальный v1 |
| Дата сборки в строке | Недетерминизм при каждом рендере — ломает тестовые ассерты |
| Инъекция версии из CI/package.json скриптом | Проекту требуется build step, которого нет; дрейф закрывается sync-тестом |
| Изменения `opencode.json`, permissions/policies, плагина `lint-and-guard` | Эксперимент не задевает систему безопасности репозитория |
| Push в `origin/main` | Требует отдельного подтверждения пользователя |
| Другие задачи бэклога (item 19: `.gitattributes`, автофикс-правила ESLint) | Не являются предметом GSD-эксперимента |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOOTER-01 | Phase 1 | Complete |
| FOOTER-02 | Phase 1 | Complete |
| FOOTER-03 | Phase 1 | Complete |
| FOOTER-04 | Phase 1 | Complete |
| DOCS-01 | Phase 2 | Complete |
| DOCS-02 | Phase 2 | Complete |
| DOCS-03 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-10-25*
*Last updated: 2026-10-25 after Phase 2 plan 02-01 execution*
