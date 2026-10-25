# Phase 2 notes — GSD-наблюдения для `docs/memory.md`

Копилка наблюдений эксперимента «about-line» (полный цикл GSD @opengsd/gsd-core v1.18.0 на учебной фиче).
Список пополняется по ходу цикла; Фаза 2 упакует его в `docs/memory.md`.

## Планирование

- **Interactive-режим**: до старта планнера потребовалось 6 ответов (worktrees → continue-without-context → skip-research → scope-подтверждения). Гейты спрашивают точечно, не «стеной».
- **Edge-probe не отработал на русском**: все 4 requirement'а вернулись `unclassified` — словарь классификатора англоязычный. Предикаты `must_haves` планнер авторовал вручную (legitimate fallback по specless-probe-fallback.md), assumptions A1–A4 задокументированы.
- **Plan-checker нашёл реальную ошибку в плане, не в коде**: позиционный ассерт «footer — последний ребёнок main» матчил не тот `</div>`. Ревизия whitespace-механикой; 2-я итерация → VERIFICATION PASSED (0/0).
- INFO-фик: ROADMAP `Mode: mvp` vs «standard» в промпте чекера — косвенное расхождение контекстов, на задачи не влияет.

## Исполнение

- Tracer-first: один production-срез (markup → оба тестовых слоя → скриншот) Rhino-коммитом, потом расширение. Для однофайловой фичи работало отлично.
- Sequential без worktrees (`use_worktrees=false`): OpenCode-субагенты не имеют harness-worktree флага, e2e требует node_modules — executor честно работал на main.
- Executor обновляет STATE/ROADMAP через verbs (`roadmap update-plan-progress`), SUMMARY с Self-Check; оркестратор только spot-check'и + wave-гейты.

## Верификация

- **Code review — самый полезный гейт в этом цикле**: субагент-ревьюер (открытая эмуляция Skill-диспетчера в OpenCode) мутационным экспериментом нашёл **WR-01**: `slice(footerEnd, mainEnd).trim() === ""` даёт ложный зелёный при выносе footer за пределы `<main>` — `String.prototype.slice(start, end)` при `start > end` возвращает `""`. Фикс 2 строками (`toBeLessThan` перед slice), коммит `25430e3`, мутационно проверен red↔green.
- **Disposition-реестр** (`01-REVIEW-DISPOSITION.md`) — одна строка на finding (open/fixed/skipped/deferred), переживает ре-ревью; в этой фазе: WR-01 → fixed, IN-01..03 → open (сознательное решение пользователя).
- Gap-closure / regression gates были аккуратно skipped по `section_manifest.excluded` — пропуск по манифесту, не по забывчивости.

## UAT и verify-work

- **Coverage-режим (#1602) работает как надо**: SUMMARY с `coverage:`-блоком дал D1–D4 auto-passed (не показывать человеку) и D5 human-gudgement (визуальная оценка скриншота) — ровно 1 вопрос человеку вместо 5.
- Automated-UI-verification честно отработал через Playwright MCP + fixture `tests/ui/server.mjs`: живой скриншот → сравнение с закоммиченным артефактом 1:1.
- Сверка commit-claims (#3968): `commits: 3` в блоке `actuals:` без git-ключей → WARNING с измеренным состоянием (правильная деградация, не блокер).

## Нужен ли «security-checklist»?

Отдельного файла security-checklist в GSD **нет** — роль выполняет связка из 4 артефактов:

1. **SECURITY.md** (`templates/SECURITY.md`) — per-phase contract: trust boundaries, STRIDE-register, accepted risks log, **Sign-Off чек-лист** (dispositions / accepted risks / `threats_open: 0` / `status: verified`).
2. **Роль аудитора** (`agents/gsd-security-auditor.md`) — проверяет, что каждая задокументированная mitigation реальна в коде.
3. **ASVS-лесенка глубины** (`references/security-asvs-levels.md`) — L1 grep-level / L2 boundary placement / L3 end-to-end trace: чем выше уровень, тем глубже проверка.
4. **Гейт** `workflow.security_enforcement` — блокирует переход к следующей фазе без непустого SECURITY.md.

Короткий путь (short-circuit) при `threats_open: 0` + register авторован в плане + ASVS == 1 → без спавна аудитора, L1-grep-глубина достаточна — так фаза 1 закрыла 4/4 угрозы honestly и быстро.

Не выполнен (осознанно, по решению пользователя при verify:post): `ui-review` — 6-pillar визуальный аудит; ключевая визуальная часть покрыта UAT-тестом 5.

## Мета

- Пропуск гейтов по манифесту и честные WARNING вместо блокеров — стиль GSD v1.18: fail-open на advisory, fail-closed на настоящих gate'ах (human_needed / secure-phase halt).
- Субагент-эмуляция Claude Skill-диспетчера в OpenCode везде работает: `ref.skill → subagent gsd-* per role file` — полного деградационного падения не встречено ни разу.
