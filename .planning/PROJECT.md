# GSD Experiment: About-line

## What This Is

Учебный проект для полного прохода GSD-цикла на существующем репозитории `my-opencode-project` (OpenCode V2 конфигурационный скелет). Цикл пинается на изолированной мини-фиче: строка «о себе» (about-line) в подвале демо-калькулятора `calculator.html` с проверками в тестах и обновлением документации.

## Core Value

Пройти полный GSD-цикл без риска для конфигурации репозитория: PROJECT → REQUIREMENTS → ROADMAP → план → выполнение → verify, с фиксацией наблюдений об удобстве фреймворка.

## Requirements

### Validated

- ✓ Демо-калькулятор `calculator.html` с UI e2e на Playwright — existing
- ✓ Три слоя защиты секретов (`permissions` + `policies` + плагин) — existing
- ✓ CI (lint + test + test:ui) и husky-хуки — existing

### Active

- [ ] About-line в подвале `calculator.html`: имя приложения + версия (фаза 1)
- [ ] Структурный тест на наличие about-line в разметке (фаза 1)
- [ ] UI e2e-проверка видимости about-line (фаза 1)
- [ ] Обновление README/docs (about, memory) с упоминанием фичи (фаза 2)
- [ ] Заметки-наблюдения об GSD-цикле в `docs/memory.md` (фаза 2)

### Out of Scope

- Изменения `opencode.json`, permissions/policies, плагина `lint-and-guard` — эксперимент не должен задевать систему безопасности
- Любая работа с секретами и защищёнными путями (`.env`, `secrets/`, `*.key`, `*.pem`) — запрещено правилами репозитория
- Пуш в `origin/main` — требует отдельного подтверждения пользователя
- Другие задачи бэклога (item 19: `.gitattributes`, автофикс-правила ESLint и т.п.) — не являются предметом GSD-эксперимента

## Context

- Репозиторий — конфигурационный скелет, прикладного кода нет, кроме `calculator.html` (один файл HTML+CSS+JS)
- Карта кодовой базы уже снята GSD: `.planning/codebase/` (7 документов)
- Тестовая база: 119 тестов Vitest (18 config + 23 structure + 51 e2e + 27 plugins) + 1 UI e2e Playwright
- Пользователь впервые пробует GSD; ожидается полный цикл (`/gsd-new-project` → `/gsd-plan-phase` → `/gsd-execute-phase`) и наблюдения

## Constraints

- **Security**: не трогать `opencode.json`, `.opencode/plugins/`, защищённые пути — правило репозитория
- **Stack**: только изменение `calculator.html`, `tests/structure.test.js`, `tests/ui/calculator.spec.js`, документация — чтобы фича осталась изолированной
- **Verification**: каждая фаза проходит `npm run lint` + `npm test` (`120+` тестов), при UI-изменениях — `npm run test:ui`
- **Git**: Conventional Commits, husky pre-commit; `git push` — только с явного разрешения

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Учебная задача («about-line») вместо реального бэклога | Изоляция: фича не задевает конфиг/права, легко проверить тестами | — Pending |
| 2 фазы (фича, документация) | Полный цикл из нескольких фаз в мини-объёме | — Pending |
| Наблюдения складывать в `docs/memory.md` | Требование конвенции репозитория — пользовательский журнал | — Pending |

---
*Last updated: 2026-10-25 after initialization*
