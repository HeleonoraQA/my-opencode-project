# Walking Skeleton — GSD Experiment: About-line

**Phase:** 1
**Generated:** 2026-10-25

## Адаптация шаблона (важно)

Этот репозиторий — **статическое одностраничное демо** (`calculator.html` одним файлом, без build step, БД, роутинга, бэкенда и deployment-цели). Классическое скелетное ядро «scaffold + DB read/write + route + deploy» здесь неприменимо. Поэтому самым тонким end-to-end Working Skeleton продолжения является другой путь: **about-line разметка проходит ОБА слоя верификации** — структурный тест читает байты файла как текст (Vitest, `readFileSync`), а Playwright доказывает реальный рендер в настоящем Chrome (webServer `tests/ui/server.mjs` на 127.0.0.1:8123) — и результат фиксируется закоммиченным артефактом `docs/screenshots/e2e-calculator.png`. Это «полный стек» данного домена: файл → два независимых тестовых потребителя → CI-гейты.

## Capability Proven End-to-End

> Открыв калькулятор в браузере, пользователь видит в подвале панели строку «Калькулятор v1.0.0» — и корректность этой строки гарантирована двумя независимыми слоями тестов (байты файла + реальный рендер), а перегенерированный скриншот подтверждает визуально.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework / build | Нет: vanilla single-file HTML + inline CSS + inline JS (`calculator.html`, 1 файл) | Стек-констрейнт проекта: «нет build-шага»; инвариант однофайловости закреплён существующими structure-тестами (нет `<script src>`, нет `<link rel=stylesheet>`, inline SVG favicon) |
| Data layer | Нет БД: единственный источник истины версии — `package.json` `"version"` (сейчас 1.0.0); версия дублируется осознанно (видимый текст + `data-version`), дрейф ловится structure-sync тестом | Без build-шага инъекция невозможна; sync-тест (3 строки) дешевле скрипта-инъекции; дублирование — осознанный trade-off (ARCHITECTURE.md, Pattern 1) |
| Routing | Нет: один файл `calculator.html`, раздаётся статическим сервером `tests/ui/server.mjs` | Домен — демо-страница; никаких маршрутов не появится |
| Deployment target | Нет деплоя: единственный «runtime» — локальный Playwright webServer `node tests/ui/server.mjs` на 127.0.0.1:8123 (Chrome channel, `reuseExistingServer: !process.env.CI`) и GitHub Actions CI (`npm run lint` → `npm test` → `npm run test:ui`, конфиг ci.yml не меняется) | Эксперимент не включает публикацию; push в origin — отдельное per-request решение |
| Auth | N/A — нет | Нет пользовательских данных и сессий |
| Test layering | Два слоя, обязанные согласиться на одни байты `calculator.html`: (1) Vitest structure — substring/regex по `readFileSync`; (2) Playwright e2e — реальный Chrome, `getByTestId`-дисциплина, `toBeVisible`/`toContainText`/`toHaveAttribute`, `consoleErrors === []` | Substring ничего не докажет про видимость; e2e слишком дорога для формата — слоистая дешёвость (ARCHITECTURE.md, Pattern 3) |
| Selector contract | `data-testid` — единственный межслойный хук (`display`, `expression`, новый `about-line`); никаких `getByText`/позиционных селекторов | Репо-дисциплина; устойчивость к копирайту (Питфолл 4) |
| Commit conventions | Conventional Commits (`feat(calculator): …`, `test(calculator): …`); husky pre-commit = lint-only, pre-push = lint+test, commit-msg = формат | Существующая hook-цепочка, не меняется |
| Scope boundaries | Безопасность-конфиг репозитория (`opencode.json`, permissions/policies, плагин) — out of scope, не трогается | Согласно REQUIREMENTS Out-of-Scope и правилам проекта |

## Stack Touched in Phase 1

- [x] «Сквозная разметка» — about-line markup в `calculator.html` (последний ребёнок `<main class="calculator">`, вне body-grid)
- [x] «Data» — version из `package.json`, транспорт через видимый текст + `data-version`, sync-тест вычисляет ожидание через `readFileSync`
- [x] «UI-взаимодействие» — footer виден в реальном Chrome (`npm run test:ui`)
- [x] «Артефакт» — `docs/screenshots/e2e-calculator.png` перегенерирован и закоммичен
- [x] Деплой — N/A (адаптация: документированная локальная команда полного прогона = `npm run test:ui`); неприменимо к статическому демо

## Out of Scope (Deferred to Later Slices)

- FOOTER-05 (v2): muted-оформление footer (var(--muted), мелкий шрифт, центрирование) — deliberately deferred; в Phase 1 markup добавляется БЕЗ новых CSS-правил
- Репо-ссылка и aria-label в футере (v1.x: требует осознанного решения по обходу global-keydown-ловушки Enter)
- CI-инъекция версии / bump-скрипты (только если появится build-шаг)
- Phase 2 (следующий этап): документация README, `docs/about.md`, `docs/memory.md`, счётчики тестов в `AGENTS.md`
- Push в origin/main — отдельное подтверждение пользователя

## Subsequent Slice Plan

- Phase 2: Documentation sync — README упоминает about-line и способ проверки (`npm run test:ui`); `docs/about.md` описывает фичу; счётчики тестов в `AGENTS.md` актуализированы; `docs/memory.md` фиксирует наблюдения о GSD-цикле. Никакие архитектурные решения из этого skeleton не пересматриваются.
