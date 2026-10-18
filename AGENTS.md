# AGENTS.md

## Repository state

OpenCode configuration scaffold for `https://github.com/HeleonoraQA/my-opencode-project.git`.
There is no application source code yet — the repo holds agent configuration, docs, and a
Node-based verification toolchain.

Layout:

- `AGENTS.md` — this file
- `README.md` — project overview and agent workflow
- `rules.md` — hard project rules, loaded via `opencode.json` `instructions`
- `opencode.json` — OpenCode V2 configuration (`instructions` + `permissions` rules)
- `docs/` — `plan.md`, `memory.md`, `about.md`
- `.opencode/skills/` — `run-tests/SKILL.md`, `lint/SKILL.md`
- `src/permissions.js` — OpenCode `permissions` matcher (last-match-wins, `*`/`?` globs)
- `tests/` — Vitest suites: `config.test.js`, `structure.test.js`, `e2e/permissions.test.js`
- `eslint.config.js`, `package.json`, `package-lock.json` — toolchain
- `.husky/pre-commit` — runs `npm run lint && npm test` on every commit
- `.husky/pre-push` — runs `npm run lint && npm test` before push
- `.husky/commit-msg` — enforces Conventional Commits (`type(scope): summary`)
- `.github/workflows/ci.yml` — GitHub Actions: lint + test on push/PR
- `node_modules/` — installed deps, git-ignored (never edit by hand)

## Commands

- Install deps: `npm install`
- Run tests once: `npm test` (Vitest)
- Run e2e tests only: `npm run test:e2e`
- Watch tests: `npm run test:watch`
- Lint: `npm run lint`
- Lint and autofix: `npm run lint -- --fix`

After changing config, docs, or tests, run `npm run lint` and `npm test`.

Both also run automatically: a husky `pre-commit` hook blocks commits that fail them,
and GitHub Actions (`.github/workflows/ci.yml`) runs them on every push and PR.
Commit messages must follow Conventional Commits (`type(scope): summary`), enforced by `.husky/commit-msg`.

## Правила безопасности
- Никогда не читать и не изменять файлы `.env` или `.env.*` (запрет задан в `opencode.json`).
- Перед выполнением любых операций с файлами проверять, не попадает ли путь под запрет.
