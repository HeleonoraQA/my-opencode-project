---
phase: 01-about-line-footer-two-layer-tests
reviewed: 2026-10-25T14:15:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - calculator.html
  - tests/structure.test.js
  - tests/ui/calculator.spec.js
  - docs/screenshots/e2e-calculator.png
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-25T14:15:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Ревью фазы 1 (about-line footer + два тестовых слоя) по коммитам `8b35b94` (feat), `f62a195` (test), `d5e4cca` (test). Разметка `calculator.html` в точности соответствует плану: `<footer class="about" data-testid="about-line" data-version="1.0.0">Калькулятор v1.0.0</footer>` — последний ребёнок `<main class="calculator">` (строка 179), inline `<script>` не тронут (diff коммита 8b35b94 — только +2 строки после закрытия `.keys`), новых CSS-правил нет, внешние ресурсы отсутствуют. Структурный и e2e-слои вычисляют ожидаемую версию из `package.json` (readFileSync + JSON.parse) — guard-запрет P3 подтверждён поиском: literal `1.0.0` в обоих тестовых файлах отсутствует. Скриншот `docs/screenshots/e2e-calculator.png` закоммичен в фича-коммит 8b35b94 (~12.4 КБ, демо-кадр без пользовательских данных/секретов), с тех пор байт-неизменён (отклонение из SUMMARY «PNG не изменился при повторном прогоне» подтверждено git diff vs HEAD — артефакт соответствует финальной разметке). Базлайн зелёный на диске: `npm test` — 123 passed (27 в structure.test.js), `npm run lint` — exit 0.

По безопасности (ASVS L1) замечаний нет: статичный HTML без нового исполняемого кода, без fetch/XHR, без внешних ресурсов, без секретов; хардкод версии в самой разметке — задокументированное проектное решение (single source of truth в markup), защищённое sync-тестами обоих слоёв (дрейф при bump → красный тест). Найден один дефект надёжности теста (WR-01, механика whitespace-only даёт ложный зелёный при выносе footer за пределы `<main>`) — обнаружен мутационным экспериментом на реальном файле; плюс три замечания уровня Info о хрупкости ассертов.

**Verified mutations (evidence for WR-01):** на мутациях реального `calculator.html` (footer вынесен сиблингом после `</main>` → slice вычисляется пустым → тест зелёный; footer перенесён перед `.keys` → непробельный slice → тест красный; семантика `String.prototype.slice(start > end)` → `""`). Ситуация «footer перед `.keys`» план прямо обещал ловить красным (Task 2 behavior); «footer после `</main>`» остаётся зелёным — hole.

## Critical Issues

Не найдено. Критических дефектов (уязвимости, некорректное поведение фичи, риск потери данных) не обнаружено.

## Warnings

### WR-01: Last-child assertion проходит зелёным, когда footer вынесен СИБЛИНГОМ за пределы `<main>` (слепая зона whitespace-механики)

**File:** `tests/structure.test.js:70-72`
**Issue:** Ассерт позиционности построен как `html.slice(footerEnd, mainEnd).trim()` → `""`. При выносе footer за пределы `<main>` (например, сиблингом `<main>` в `<body>` после `</main>` — ровно тот сценарий «НЕ сиблинг `<main>`», который план фиксирует как Питфолл 1 и чей запрет зашит в must_haves) `footerEnd` становится **больше** `mainEnd`, а `String.prototype.slice(start, end)` при `start > end` возвращает пустую строку → `.trim()` → `""` → тест остаётся **зелёным**, хотя last-childность сломана. Контраст: перенос footer перед `.keys` внутри `<main>` действительно даёт красный (проверено той же механикой на реальном файле), т.е. дыра направленная: ловятся сдвиги внутри `<main>` (включая behavior-примеры плана «подстановка элемента после footer» и «перенос footer перед `.keys»), но не вынос за `</main>` — а must_haves прямо требует красный тест именно на «НЕ сиблинг `<main>`»). Регрессия разметки footer-outside-main пройдёт все три гейта и попадёт в перегенерированный скриншот без красного теста.
**Fix:** Явно зафиксировать порядок индексов перед slice:

```js
const footerEnd = html.indexOf("</footer>") + "</footer>".length;
const mainEnd = html.lastIndexOf("</main>");
expect(footerEnd).toBeLessThan(mainEnd); // footer находится ВНУТРИ <main>
expect(html.slice(footerEnd, mainEnd).trim()).toBe("");
```

(опционально добавить и `expect(html.indexOf("<footer")).toBeGreaterThan(html.lastIndexOf("</div>"))` для «после .keys», но `toBeLessThan` уже закрывает «за пределами main»).

## Info

### IN-01: Видимый текст footer проверяется только substring-ассертами — дополнительный «мусорный» текст в footer остаётся зелёным

**File:** `tests/structure.test.js:63,56` (`tests/ui/calculator.spec.js:26`)
**Issue:** Все три видимых-текстовых проверки — substring-ные: регэксп `/Калькулятор v\d+\.\d+\.\d+/` по фрагменту footer (structure.test.js:63), `toContain` (structure.test.js:56), `toContainText` (calculator.spec.js:26). Если в footer появятся посторонние видимые символы/текст после версии (например, `<footer …>Калькулятор v1.0.0 мусорный-текст</footer>` — неинтерактивный, regexp-валидный), все слои останутся зелёными, а формат FOOTER-01 («строка „Калькулятор v1.0.0"») фактически разъедется. Это осознанное узкое место: Task 3 <action> прямо запрещает добавлять более строгих точных ассертов («никакого exact: true по видимому тексту»), так что severity — Info. Автономность демо и `consoleErrors === []` эта ситуация не ломает, интерактивные payload-ы (button/a) ловит отдельная проверка.
**Fix:** При желании усилить одной строкой (без нарушения запрета на позиционные селекторы — это byte-слой, а не DOM): очистить footer-фрагмент от тегов и сравнить целиком: `expect(footer.replace(/<[^>]+>/g, "").trim()).toBe("Калькулятор v" + pkg.version)`.

### IN-02: Хрупкие null-разыменования в match-ассертах — crash вместо читаемого сообщения при падении

**File:** `tests/structure.test.js:51,62,67`
**Issue:** `(html.match(/<footer\b/g)).toHaveLength(1)` упадёт как `TypeError: Cannot read properties of null` при отсутствии footer (match возвращает null), а `html.match(/<footer[\s\S]*?<\/footer>/)[0]` (строки 62, 67) тоже упадёт до выполнения главного ассерта. Тест — красный (false positive невозможен), значит на корректность гарантий не влияет, но диагностика при регрессии становится нечитаемой («строка с TypeError», а не «footer исчез»/«footer не единственный»). Типичный footgun при будущих изменениях тестового набора.
**Fix:** Использовать безопасную форму: `const footerMatches = html.match(/<footer\b/g) ?? []; expect(footerMatches).toHaveLength(1);` и `const footer = html.match(/<footer[\s\S]*?<\/footer>/); expect(footer).not.toBeNull();` затем `expect(footer?.[0]).toMatch(...)`.

### IN-03: Негативный regex неинтерактивности пропускает `<abbr>`/`<area>` (word-boundary после `a`)

**File:** `tests/structure.test.js:68`
**Issue:** `/<a\b|<button\b|tabindex/i` — `\b` после `a` не сработает на `<abbr`, `<area` (там `a` продолжается буквой — boundary-нет). Т.е. подобный неинтерактивный тег `<area>` пройдёт проверку, хотя и нарушит дух запрета. В рамках plan-scope P1 (что прямо перечислено: `<a>`, `<button>`, `tabindex`) ассерты работают корректно — временная вставка `<a>`/`<button>`/`tabindex` даёт красный (fail-first provable подтверждена механикой) — так что severity прикрыт scope-ом запрещённых элементов, но на слой возникает неочевидное «почему проходит». Смысла блокировать все HTML-теги на substring-слое нет — существующих запретов достаточно для перечисленного в P1.
**Fix:** При желании — явный список: `/</?\s*(a|button|abbr|area)\b|tabindex/i` против footer-фрагмента, либо, если scope P1 не расширяется, оставить как есть и задокументировать намеренно-узкий перечень.

---

_Reviewed: 2026-10-25T14:15:00Z_
_Reviewer: GLM-5.3-Flash (gsd-code-reviewer, OpenCode subagent)_
_Depth: standard_
