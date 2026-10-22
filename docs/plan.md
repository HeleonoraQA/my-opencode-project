# План проекта
1. [x] Инициализировать структуру проекта и документацию.
2. [x] Настроить права доступа агента и правила путей.
3. [x] Создать файлы навыков и реализовать простое функциональное тестирование.
4. [x] Добавить e2e-тесты и обеспечить их прохождение.
5. [x] Разделить навыки на автоматический (`lint`) и ручной (`run-tests`), подключить автолинтер по событию `file.changed`.
6. [x] Расширить path-scoped запреты (`docs/.env`, `secrets/*`) и добавить хук блокировки защищённых чтений/правок.
7. [x] Покрыть хуки `.opencode/hooks/*` тестами структуры.
8. [x] Проверить фактическую поддержку `tool.before.*` и `filters.paths` в OpenCode V2: JSON-хуки в V2 не поддерживаются (только плагины), описания хуков переведены в статус соглашений проекта.
9. [x] Расширить e2e-сценарии: `*.key`, `*.pem`, `docs/.env`, `secrets/*`, приоритет правил (last-match-wins).
10. [x] Перевести блокировку секретов на глоб-паттерны V2 (`permissions`) и добавить дублирующий hard-deny слой (`policies`).
11. [x] Реализовать рабочий механизм автолинтера и блокировки в V2 — плагин `.opencode/plugins/lint-and-guard` (`tool.hook("execute.after")` / `tool.hook("execute.before")`); JSON-хуки удалены.
12. [x] Проверить плагин в живом OpenCode V2: `GET /api/plugin` → `state.status = "active"`, в логе `loading plugin`, `execute.after` реально запускал линтер. Найдены и исправлены: запуск через `process.execPath` (`opencode-cli.exe` вместо Node), линт не покрытых конфигом `.md`/`.json`. Зафиксировано ограничение: после перезагрузки плагина хуки в уже открытой сессии не восстанавливаются — нужна новая сессия/перезапуск приложения.
13. [x] После перезапуска приложения проверен автолинтер в новой сессии: временное правило `semi` + пробный `.js` без точек с запятой — файл был исправлен сразу после `write`, новых `CliError` в логе нет (запуск идёт через `node`). Пробные изменения удалены, конфиг восстановлен.
14. [x] Подключён Playwright MCP: `mcp.servers.playwright` (npx, Chrome headless, isolated), `opencode mcp list` → connected, smoke-тест `browser_navigate` на example.com; `browser_run_code_unsafe` запрещён, артефакты `.playwright-mcp/` в `.gitignore`.
15. [x] Написан демо-калькулятор `calculator.html` и проверен UI через Playwright MCP: сценарии арифметики, процентов, деления на 0, backspace и клавиатуры; скриншоты desktop/mobile; консоль без ошибок.
16. [x] Добавлен зелёный UI e2e на Playwright Test: `tests/ui/calculator.spec.js` + `tests/ui/server.mjs` + `playwright.config.js` (Chrome channel, webServer), `npm run test:ui`, скриншот `docs/screenshots/e2e-calculator.png`, шаг в CI; Vitest исключает `tests/ui/**`.
