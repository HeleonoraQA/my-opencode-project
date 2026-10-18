# AGENTS.md

## Repository state

This repository (`https://github.com/HeleonoraQA/my-opencode-project.git`) is currently a
**scaffold with no source code or manifests**.
Do not assume a language, framework, or toolchain — none is configured yet.

Layout:

- `AGENTS.md` — this file
- `opencode.json` — OpenCode configuration (V2 `permissions` rules)
- `docs/` — `plan.md`, `memory.md`, `about.md`
- `.opencode/skills/` — `run-tests/SKILL.md`, `lint/SKILL.md`

## Guidance for agents

- Verify the actual contents before acting; the tree may have changed since this was written.
- There are no build, test, lint, typecheck, or codegen commands yet. Do not invent or guess them — check for a manifest/config first, and ask if none exists.
- Once a project is added, replace this file with real, repo-specific instructions (exact commands, entrypoints, package boundaries, test workflow).

## Правила безопасности
- Чтение файлов `.env` и `.env.*` разрешено.
- Никогда не изменять файлы `.env` или `.env.*`.
- Перед операциями изменения проверять, не попадает ли путь под запрет.
