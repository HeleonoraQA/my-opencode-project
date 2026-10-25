# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0.0 — GSD Experiment: About-line

**Shipped:** 2026-10-25
**Phases:** 2 | **Plans:** 2 | **Sessions:** ~10 (оркестратор + planner/checker/executor/verifier/reviewer/security/UAT-сессии обоих фаз)

### What Was Built
- About-line футер «Калькулятор v1.0.0» (`<footer data-testid="about-line" data-version="1.0.0">`, calculator.html:179), проверенный двумя независимыми слоями: структурный Vitest (4 it + guard) и Playwright e2e в реальном Chrome
- Версия — single source of truth из package.json в обоих тестовых слоях (readFileSync+JSON.parse), guard `toBeLessThan` против хардкода (WR-01 fix фазы 1)
- Documentation sync: README / docs/about.md / AGENTS.md; счётчики во всех трёх доках сверяются динамическим counter-gate'ом с живым `npm test` (123 = 18 config + 27 structure + 51 e2e + 27 plugins)
- docs/memory.md: dated-записи + раздел «GSD-цикл (эксперимент)» — сжатие NOTES-наблюдений (удобно/неудобно/дубли AGENTS.md, security-checklist ответ)
- Полный пройденный GSD-контур: plan→checker→execute→review→disposition→fix→verify→UAT→security→complete ×2 фазы; MILESTONES.md + архив milestones/v1.0.0-*

### What Worked
- Динамический counter-gate (parse «Tests N passed» из живого npm test, сверка во всех доках, «119» banned вне dated-записей) — главный дрейф «119/23» поймался ещё на этапе планирования и не воспроизвёлся после
- Pre-check'и фаз с осознанными решениями (drift-warn, no-context, skip-research) — сэкономили дискаши без потери честности
- Code review → disposition ledger → фиксы той же сессии (WR-01×2, IN-01) — находки не потерялись, у каждой судьба зафиксирована
- Edge-probe честно дал `unclassified` на русских текстах → ручные предикаты планнера вместо ложных срабатываний

### What Was Inefficient
- `gsd_run` недоступен субагентам в OpenCode-среде → STATE/ROADMAP/REQUIREMENTS обновлялись файловыми правками executor'ом (декларировано в SUMMARY)
- PowerShell-канал: кириллица в выводе ломается (encoding), `&&` не работает → тестовые гейты через ASCII-only node -e, JSON-парсинг через temp .mjs
- Пропущенный местами язык шаблонов (verify-work/render-checkpoint русификация — частично англ)
- Codebase-drift re-map отложен до конца: 8 drifted элементов копились (footprint Фаз 1+2) вместо промежуточного `/gsd-map-codebase`

### Patterns Established
- Счётчики тестов в доках — только динамически (за литералы бьёт гейт); исторические числа живут лишь в dated-записях журнала
- Версия фичи — вычисляется из package.json, никогда не хардкодится (защищено guard-ассертом)
- Честные short-circuit'ы документируются по месту (State-B security, gsd_run-расхождение в SUMMARY), а не эмулируются
- Conventional Commits + атомарные коммиты задач; `docs(02): ...` скоп-стиль

### Key Lessons
1. Гейт защиты против дрейфа должен измерять живой источник (npm test), а не сверять текст с текстом иначе он становится свалкой для фиктивных значений столько же, сколько защищает.
2. Forex-разбор ревью-находок в disposition ledger (fixed/open/deferred + source) делает ревью谦虚 deliverable-ом, а не приложением.
3. UAT- human-checkpoint's (subjective quality) отделяются от automated-проверок coverage-классификацией — декларанты не путаются в релях дуальности.
4. OpenCode-среда: субагенты не имеют CLI (`gsd_run`), сообщение об этом — в SUMMARY, а не скрытая правка файлов мимо протокола.

### Cost Observations
- Model mix: 100% inherit (GLM-5.3-flash во всех ролях, ни одного параметра model субагентам)
- Sessions: ~10 (по 3-5 субагентов на фазу: planner, checker(+revision), executor, reviewer, fixer, verifier, security, UAT-локальный)
- Notable: полный цикл 2-фазного milestone живёт заметно дешевле, чем ручной equivalent, только если pre-check'и используются осознанно (skip/research решаются по фактам фазы)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0.0 | ~10 | 2 | Первый полный GSD-цикл: shift с «доверять редактору» на «проверять гейтами» (dynamic counter-gate, disposition ledger, ASVS L1 security) |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0.0 | 123 vitest + 1 Playwright spec | e2e прогон + UAT 5+6 | 0 |

### Top Lessons (Verified Across Milestones)

1. Dynamic-verifies-living-source — счётчики/версии/факты сверяются с источником правды, не с копией копии.
2. Отдельно security и review находки живут в собственных ledgers (REVIEW-DISPOSITION / SECURITY.md threats_open), а не теряются в чате.
