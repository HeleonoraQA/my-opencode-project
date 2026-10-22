# О проекте

## Суть и стек
- **Суть:** конфигурационный скелет для OpenCode V2 — права доступа, плагин с автолинтером и блокировкой путей, тесты и память проекта. Прикладного кода в репозитории нет.
- **Стек:** OpenCode V2 (desktop, Windows), Node.js 22 (ESM), Vitest, ESLint, Husky, GitHub Actions (ubuntu-latest).
- **Модель:** выбирается в клиенте OpenCode и в репозитории не фиксируется.

## Защита секретов
- Запрет на чтение и изменение `.env`, `.env.*`, содержимого `secrets/`, `*.key`, `*.pem` на любой вложенности.
- Три слоя защиты:
  1. `permissions` в `opencode.json` — `read`/`edit` → `deny` для глоб-паттернов `*.env`, `*.env.*`, `*secrets/*`, `*.key`, `*.pem`;
  2. `policies` — `tool.use` → `deny` для тех же путей: не перекрывается сохранёнными разрешениями «Allow always» и правилами агентов;
  3. плагин `.opencode/plugins/lint-and-guard` — блокировка в `execute.before` (защита в глубину).
- В V2 `*` совпадает и с `/`, поэтому паттерн действует на любой вложенности, а префикс `**/` не нужен и не покрыл бы корневой `.env`.
- Проверки: `tests/e2e/permissions.test.js` (48 сценариев), `tests/config.test.js` (форма `permissions`/`policies`), скриншоты в `docs/screenshots/`.

## Автолинтер
- Плагин `.opencode/plugins/lint-and-guard/index.js` после успешного `write`/`edit`/`patch` запускает `eslint --fix` по изменённому `.js`-файлу (остальные расширения не покрыты `eslint.config.js`).
- Линтер запускается через `node` из PATH: в рантайме OpenCode `process.execPath` — это `opencode-cli.exe`, а не Node.
- Дополнительно `husky pre-commit` запускает `npm run lint`, `pre-push` — `npm run lint && npm test`.
- Ограничение: правки самого плагина подхватываются только в новой сессии OpenCode (или после перезапуска приложения) — горячая перезагрузка не восстанавливает хуки в открытой сессии.

## MCP: Playwright
- Сервер `playwright` в `opencode.json` → `mcp.servers`: локальный запуск `npx -y @playwright/mcp@latest --browser chrome --headless --isolated`.
- Chrome — установленный в системе (`--browser chrome`), поэтому браузеры Playwright не скачиваются; `--headless` экономит ресурсы, `--isolated` не сохраняет профиль на диск.
- `mcp.timeout.startup = 120000` — первый запуск `npx` скачивает пакет и не укладывается в стандартные 30 с.
- Инструмент `playwright_browser_run_code_unsafe` (RCE-эквивалент) запрещён через `permissions` (`action: playwright_browser_run_code_unsafe` → `deny`).
- Артефакты сессии (снимки accessibility-дерева) попадают в `.playwright-mcp/` — каталог в `.gitignore`.
- Проверка: `opencode mcp list` → `✓ playwright connected`.

## Навыки
- `lint` — автоматический (запускается через `pre-commit`).
- `run-tests` — ручной, только по команде пользователя.

## Команды
- `npm install` — установка зависимостей.
- `npm run lint` — проверка ESLint.
- `npm test` — все тесты (109: 18 config + 16 structure + 48 e2e + 27 plugins).
- `npm run test:e2e` — только e2e-тесты прав.
- `npm run test:watch` — тесты в режиме наблюдения.

## Документация
- `AGENTS.md` — правила и рабочий процесс агента.
- `rules.md` — жёсткие правила проекта.
- `docs/plan.md` — план работ и статус пунктов.
- `docs/memory.md` — журнал изменений и следующий шаг.
