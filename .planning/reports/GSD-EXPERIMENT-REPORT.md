# Финальный отчёт об эксперименте GSD «about-line»

**Эксперимент:** полный жизненный цикл GSD (@opengsd/gsd-core **v1.18.0**) на учебном репозитории `my-opencode-project`, среда OpenCode (агент: opencode, модель GLM-5.3-flash во всех ролях, параметр `model` субагентам не передавался — все роли `inherit`).
**Milestone:** v1.0.0 (тэг опубликован), 2 фазы, 4 плана-задачи, 7/7 требований закрыты.
**Период:** 2026-10-18 → 2026-10-25; сам GSD-цикл ( обе фазы от планирования до закрытия) — **один день** (2026-10-25).
**Отчёт написан:** 2026-10-25. Все цифры — из артефактов (`.planning/milestones/v1.0.0-*`, `MILESTONES.md`, `RETROSPECTIVE.md`, git-лог), не по памяти.

---

## 1. Что проверял эксперимент

Гипотеза: GSD-фреймворк можно провести **честно, от начала до конца, в OpenCode-среде** на изолированной учебной задаче, не ломая безопасность конфигурационного скелета (opencode.json / permissions / policies / плагин — out of scope, проверялось scope-fence на каждом шаге).

Полный контур, пройденный **дважды** (по одной фазе на проход):

```
plan-phase → checker (+revision) → execute-phase → code review → disposition → fixes
→ verify (must_haves + fingerprint) → UAT → security → phase.complete → milestone
```

## 2. Фаза 1 — «About-line footer + two-layer tests»

| Гейт | Результат |
|---|---|
| Планнер-чекер | нашёл реальную ошибку **в плане**: позиционный ассерт «footer — последний ребёнок `<main>`» (`slice(footerEnd, mainEnd).trim() === ""`) матчил не тот `</div>`; ревизия whitespace-механикой, итерация 2 → PASSED 0/0 |
| Исполнение | tracer-first (markup → оба тестовых слоя → скриншот одним коммитом), sequential на main (worktrees недоступны OpenCode-субагентам, e2e требует node_modules) |
| Code review | **самая полезная фаза цикла**: ревьюер провёл мутационный эксперимент и нашёл WR-01 — `slice(start, end)` при `start>end` возвращает `""` → ложный зелёный при выносе footer за `<main>`; фикс 2 строками (`toBeLessThan` перед slice, `tests/structure.test.js:72`), коммит `25430e3`, проверен red↔green |
| Disposition ledger | WR-01 → fixed; 3 INFO → осознанно open |
| Верификация | 5/5 must_haves, fingerprint CLI |
| UAT | 5/5 (coverage-режим: D1–D4 auto-passed, 1 человеческий вопрос — визуальная оценка скриншота; automated-ui-verification живым Playwright MCP, screenshot equality) |
| Security | честный **State-B short-circuit** (docs-only позиция → docs+tests, 0 installs): 4/4 угрозы CLOSE, `threats_open: 0`, ASVS L1 |

## 3. Фаза 2 — «Documentation sync»

| Гейт | Результат |
|---|---|
| Pre-checks | 3 осознанных решения: codebase-drift **warn** (4 файла = вывод Фазы 1), continue-without-context, skip-research |
| Планнер-чекер | 2 warnings (1 нереализуемый литерал «Tests  4 passed», 1 — гейт уже обещанного охвата) → ревизия: динамический counter-gate расширен на **все три дока**, planner смоук-тестнул гейт (exit 1 на stale «119» = реальный дрейф пойман) → PASSED |
| Исполнение | 3 задачи/5 коммитов; **дивергенция:** `gsd_run` недоступен субагенту → STATE/ROADMAP/REQUIREMENTS обновлены файловыми правками, расхождение декларировано в SUMMARY (Self-Check: PASSED) |
| Динамический counter-gate | верификатор воспроизвёл: N=123 спарсен из живого `npm test` и найден в README/«(123)», about/«(123: 18+27+51+27)», memory; «119» только в dated-записи журнала |
| Code review | WR-01 (`docs/about.md:15` «48»→факт «51») + IN-01 (`docs/memory.md:39` «+5»→факт «+4») — **оба исправлены той же сессией** (`fe967d3`, `48a5af9`), ledger 0/2 open |
| Верификация → UAT | verifier: 6/6, `human_needed` (2 человеко-чекпоинта) → UAT 6/6 pass → канонизация отчёта в `passed` (№4663-механика) |
| Security | skipped на verify:post (решение пользователя) → гейт verify-work честно заблокировал продвижение → secure-phase запущен по запросу, State-B, `threats_open: 0` (`f122afd`) |

## 4. Сравнение фаз (главное для методики)

| Измерение | Фаза 1 (код) | Фаза 2 (docs) | Вывод |
|---|---|---|---|
| Гейты, реально поймавшие баги | checker (план ошибочен) + review (мутационное тестирование) | checker (нереализуемый литерал) + review (сталые счётчики) | review+checker — единственные две позиции, которые ловят не «пронесло», а реальные дефекты |
| Уникальная ценность verifier | подтвердил must_haves | проверил счётчики **динамически** (живой npm test) | верификация живого источника — ключевой паттерн |
| UAT | coverage: 4 auto + 1 human | coverage: 4 auto + 2 human | экономия на человеке работает одинаково |
| Честность short-circuit'ов | State-B security | gsd_run-расхождение + security-skip→гейт | GSD fail-open на advisory, **fail-closed** на настоящих блокерах (secure-phase halt, human_needed) |
| Velocity | полный цикл фазы в сессию | то же | стоимость адекватна; пуш по ходу не потребовался |

## 5. Ограничения и различия сред (OpenCode vs базовый рантайм GSD)

1. **`gsd_run` CLI недоступен субагентам** — verbs (`phase.complete`, `roadmap update-plan-progress`, `state.*`) не вызываются из субагентов; выход — файловые правки executor'ом с декларацией в SUMMARY. Не встречено деградационного падения 角色-эмуляции (`ref.skill → subagent gsd-*`).
2. **PowerShell-канал**: кириллица вывода ломается (encoding), `&&` не поддерживается → все гейты описаны ASCII-only `node -e`; JSON-парсинг больших результатов — через temp .mjs-скрипты.
3. **Edge-probe не работает на русских текстах** (все требования `unclassified`): планнер авторует предикаты вручную (legitimate fallback). Классификатор англоязычный — ограничение словаря, не фреймворка.
4. Worktree-изоляция исполнения недоступна → sequential-исполнение на main (для однофазных мини-фич — меньшая цена).
5. Отдельные странности опыта: руссификация шаблонов частичная (mixed RU/EN в render-checkpoint), INFO-фик пунктуационных чекбоксов ROADMAP руками.

## 6. Метрики цикла

- **Коммиты на теге:** 92; за сам GSD-прогон фаз: ~35 (планирование → исполнение → ревизии → верификация → закрытие milestone + отчёты).
- **Тесты:** 123 Vitest (18 config + 27 structure + 51 e2e + 27 plugins) + 1 Playwright-спек (`npm run test:ui`), нулевые новые зависимости.
- **Ревью-находки:** 3 (WR-01×2 исправлены, IN-01 исправлен; INFO-тиры осознанно открыты).
- **Security:** 2×SECURITY.md, суммарно 8/8 угроз CLOSED, `threats_open: 0` на обеих фазах.
- **Человек-опросы:** per-phase 3-6 точечных ответов (гейты спрашивают предметно, не «стеной»).
- **Сессии субагентов:** ~10 (planner/checker/executor/reviewer/fixer/verifier/security по фазе + диспатчи transition).

## 7. Паттерны, которые стоит сохранить

1. **Динамическая верификация живого источника**: счётчики/версии в доках сверяются с `npm test`/`package.json`, а не с копией копии; «119»-политика — запрет вне dated-записей.
2. **Disposition ledger** на находки ревью: одна строка = одна судьба (open/fixed/skipped/deferred + source), переживает повторные ревью.
3. **Честные short-circuit'ы документируются по месту** (State-B security, SUMMARY-декларации расхождений), не эмулируются.
4. **Fail-open/fail-closed дисциплина**: advisory не блокирует, настоящие гейты (human_needed, secure-phase halt) — блокируют.

## 8. Вердикт

**Гипотеза подтверждена.** Полный GSD-цикл v1.18.0 прошёл в OpenCode без единого обхода протокола: каждая фаза прошла planner-checker (с реальными ревизиями), исполнение атомарными коммитами с lint-гейтами, код-ревью с исправлениями в той же сессии, живые верификации, UAT с осознанными human-checkpoint'ами, security-обзор и закрытие. Различия среды (CLI-недоступность субагентов, PowerShell-канал, англоязычный edge-probe) — ограничены, документированы и не повлияли на честность цикла. Протокольная цена разумна: обе фазы (планирование → milestone) в один календарный день, ~35 протокольных коммитов на 6 коммитов фактической работы фич.

**Куда смотреть дальше:** `/gsd-new-milestone` (следующий цикл), `/gsd-map-codebase` (refresh 8 drifted файлов — оставлено на после эксперимента), и бэклог FOOTER-05 (muted-оформление) — deferred to v2.

---

*Артефакты-источники: `.planning/milestones/v1.0.0-ROADMAP.md`, `v1.0.0-REQUIREMENTS.md`, `v1.0.0-phases/*` (REVIEW/SECURITY/UAT/VERIFICATION), `.planning/MILESTONES.md`, `.planning/RETROSPECTIVE.md`, `docs/memory.md` (журнал пользователя), git-лог `origin/main` на теге v1.0.0 (коммит `9ee045b`).*
