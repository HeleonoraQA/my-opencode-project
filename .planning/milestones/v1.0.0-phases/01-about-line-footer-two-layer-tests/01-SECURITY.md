---
phase: "01"
slug: "about-line-footer-two-layer-tests"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-25"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| репозиторий → браузер пользователя | Финальный HTML (markup + inline CSS/JS) рендерится потребителям; фаза добавила только статичный текст/атрибуты (`<footer class="about" data-testid="about-line" data-version="1.0.0">Калькулятор v1.0.0</footer>`), без выполнения нового кода, без untrusted input | Публичный статичный UI-контент |
| dev-машина → git-remote | Правки коммитятся локально; push в origin/main всегда `ask` (не входил в план-задачи) | Исходники фичи + скриншот-артефакт |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-1-01 | Tampering | репозиторий вне разрешённого скоупа (`opencode.json`, permissions/policies, `.opencode/plugins/lint-and-guard/`) | medium | mitigate | Скоуп правок зафиксирован в `files_modified` (4 файла); критерии приёмки требуют пустого `git status --porcelain`; плагин `lint-and-guard` блокирует защищённые пути в `execute.before`. Evidence: `git diff --name-only 3bf67c5..HEAD` — только скоуп-файлы + `.planning/`-артефакты | closed |
| T-1-02 | Information Disclosure | `docs/screenshots/e2e-calculator.png` (закоммиченный артефакт) | low | accept | PNG содержит только UI демо (тёмный фон, кнопки, результат «50») — без пользовательских данных, секретов, URL. Evidence: визуальная проверка скриншота в UAT (тест 5, pass) | closed |
| T-1-03 | Tampering | inline `<script>` calculator.html | low | mitigate | FOOTER-03 фиксирует запрет изменения JS; behavioral-доказательство — существующие e2e (арифметика/клавиатура/consoleErrors) зелёные. Evidence: `git diff --stat 3bf67c5..HEAD -- calculator.html` = +2 строки (only footer markup); script-блок не тронут (подтверждено verifier'ом) | closed |
| T-1-SC | Tampering | npm/pip/cargo installs (supply chain) | high | accept | Zero installs: план не выполняет package-install задач (`tech-stack.added: []`, всё в devDependencies). Evidence: `git log --oneline -- package.json` — последний коммит предшествует фазе, `package.json` не тронут фичей | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-1-01 | T-1-02 | Закоммиченный скриншот демо-UI не содержит чувствительных данных; состав кадра фиксирован и проверяется тестами | HeleonoraQA (по ревью клина фазы) | 2026-10-25 |
| R-1-02 | T-1-SC | Фаза сознательно без установки зависимостей; при появлении потребности в install — blocking `checkpoint:human-verify` по Package Legitimacy Gate протоколу | HeleonoraQA (решение зафиксировано в плане) | 2026-10-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-25 | 4 | 4 | 0 | GLM-5.3-Flash (gsd-secure-phase, L1 grep-depth; register authored at plan time → short-circuit to disposition verification) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-25
