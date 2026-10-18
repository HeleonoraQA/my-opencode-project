# AGENTS.md

## Repository state

OpenCode configuration scaffold for `https://github.com/HeleonoraQA/my-opencode-project.git`.
There is no application source code yet — the repo holds agent configuration, docs, and a
Node-based verification toolchain.

Layout:

- `AGENTS.md` — this file
- `README.md` — project overview and agent workflow
- `opencode.json` — OpenCode V2 configuration (`permissions` rules)
- `docs/` — `plan.md`, `memory.md`, `about.md`
- `.opencode/skills/` — `run-tests/SKILL.md`, `lint/SKILL.md`
- `tests/` — Vitest suites (`config.test.js`, `structure.test.js`)
- `eslint.config.js`, `package.json`, `package-lock.json` — toolchain
- `node_modules/` — installed deps, git-ignored (never edit by hand)

## Commands

- Install deps: `npm install`
- Run tests once: `npm test` (Vitest)
- Watch tests: `npm run test:watch`
- Lint: `npm run lint`
- Lint and autofix: `npm run lint -- --fix`

After changing config, docs, or tests, run `npm run lint` and `npm test`.

## Правила безопасности
- Никогда не читать и не изменять файлы `.env` или `.env.*` (запрет задан в `opencode.json`).
- Перед выполнением любых операций с файлами проверять, не попадает ли путь под запрет.
