# Architecture Research

**Domain:** Single-file HTML/CSS/JS demo app (calculator) with string-level structural tests and Playwright e2e — integration of a static about-line footer
**Researched:** 2026-10-25
**Confidence:** HIGH (based on direct reading of `calculator.html`, `tests/structure.test.js`, `tests/ui/calculator.spec.js`, CI workflow)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│              calculator.html (single file, no build)        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ markup layer │  │   CSS layer  │  │  JS layer          │ │
│  │ main.screen  │  │  <style> in  │  │  calculator logic  │ │
│  │ main.keys    │  │  <head>, CSS │  │  (display/keys/    │ │
│  │ + FOOTER(нов)│  │  variables   │  │  keyboard)         │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘ │
│         │                 │                    │            │
│  about-line — статичная разметка, JS её НЕ трогает           │
└─────────┬───────────────────────────────────────────────────┘
          │ читается/открывается тремя потребителями
┌─────────┴───────────────────────────────────────────────────┐
│                   Test layers (3 слоя)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────────────────────┐   │
│  │ structure.test.js│  │ tests/ui/calculator.spec.js    │   │
│  │ (Vitest, string: │  │ (Playwright, реальный браузер: │   │
│  │ substring/regex) │  │ getByTestId, видимость, текст) │   │
│  └──────────────────┘  └────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  GitHub Actions CI: lint → npm test → npm run test:ui       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `calculator.html` markup | владеет about-line: `<footer>` с именем приложения + версией, статичный текст | `<footer class="about" data-testid="about-line" data-version="1.0.0">Калькулятор · v1.0.0</footer>` внутри `<main class="calculator">`, после `.keys` |
| `calculator.html` CSS | оформление footer: приглушённый цвет (`--muted`), мелкий шрифт, центрирование | блок `.about { ... }` в `head style`, по соседству с `.screen`/`.keys` — kebab-case как у существующих классов |
| `calculator.html` JS | НЕ трогает about-line: нулевая связь с логикой калькулятора | отсутствие любого кода, работающего с footer — фича чисто статическая |
| `tests/structure.test.js` | строковая проверка, что footer существует и версия имеет правильный формат | новый `it(...)` в `describe("calculator page")`: `html.toContain('data-testid="about-line"')`, regex `/Калькулятор · v\d+\.\d+\.\d+/`, подсчёт `<footer` === 1 |
| `tests/ui/calculator.spec.js` | поведенческая проверка: footer реально виден пользователю и показывает версию | `page.getByTestId("about-line")` + `expect(...).toBeVisible()` / `toContainText("v1.0.0")` |
| CI (`ci.yml`) | прогон обоих слоёв без изменений конфигурации | уже покрывает оба файла — доработки не требует |

## Recommended Project Structure

```
calculator.html              # фича: +<footer class="about"> (markup + CSS, JS не трогаем)
tests/
├── structure.test.js        # +тесты в describe("calculator page"): наличие/формат about-line
└── ui/
    └── calculator.spec.js   # +видимость и текст about-line (getByTestId)
docs/
├── about.md                 # фаза 2: упоминание about-line в обзоре
└── memory.md                # фаза 2: журнал наблюдений GSD-цикла (конвенция репозитория)
```

### Structure Rationale

- **`calculator.html` — footer внутри `<main class="calculator">`, после `.keys`:** единственный экран приложения — панель калькулятора; footer должен визуально принадлежать панели. Поместить footer сиблингом `<main>` нельзя без ломки layout: `body { display: grid; place-items: center }` рассчитан на одного ребёнка, второй грид-элемент сместит центрирование панели.
- **CSS во встроенном `<style>`:** инвариант однофайловости (inline `rel="icon"`, запрет внешних ассетов проверяется структурным тестом `expect(html).not.toMatch(/<link[^>]+stylesheet/)`). Новый блок CSS обязан жить там же.
- **JS не расширяется:** существующий скрипт слушает `keydown`/`click` на `.keys`; about-line — неинтерактивный статичный узел, и любая JS-генерация его текста лишь добавила бы точку отказа и лишнюю поверхность для проверки `consoleErrors`.
- **Тесты дописываются в существующие файлы, а не создаются новые:** PROJECT.md задаёт стек-констрейнт «только `calculator.html`, `tests/structure.test.js`, `tests/ui/calculator.spec.js`, документация».

## Architectural Patterns

### Pattern 1: Static markup as single source of truth (no JS injection)

**What:** версия и имя приложения пишутся прямо в HTML-разметке; JS их не рендерит и не читает.
**When to use:** данные известны в момент правки файла (нет сборки, нет бэкенда).
**Trade-offs:** при смене версии нужно править разметку вручную; зато тесты обоих слоёв видят одни и те же байты файла, и Playwright проверяет то же, что реально показано пользователю.

**Example:**
```html
<footer class="about" data-testid="about-line" data-version="1.0.0">
  Калькулятор · v1.0.0
</footer>
```

### Pattern 2: `data-testid` as the cross-layer selector contract

**What:** один машиночитаемый хук `data-testid="about-line"` используется обоими слоями тестов: строковым (substring в разметке) и браузерным (`getByTestId`).
**When to use:** когда на одну DOM-узел смотрят тесты разного уровня.
**Trade-offs:** тестовый атрибут попадает в прод-разметку (здесь допустимо и уже сделано: `data-testid="display"`, `data-testid="expression"` — консистентно со стилем файла). Плюсы: нет зависимости от видимого текста («Калькулятор» может смениться на другой бренд), e2e не становится хрупким.

**Example:**
```js
// structure.test.js — строковый слой
expect(html).toContain('data-testid="about-line"');
expect(html.match(/<footer/g)).toHaveLength(1);

// calculator.spec.js — браузерный слой
const about = page.getByTestId("about-line");
await expect(about).toBeVisible();
await expect(about).toContainText("v1.0.0");
```

### Pattern 3: Layered assertions — cheap string tests first, browser last

**What:** проверка существования и формата — на строковом уровне (микросекунды в Vitest), проверка видимости и реального рендера — на Playwright (секунды, системный Chrome, webServer 127.0.0.1:8123).
**When to use:** когда изменение — это разметка/CSS без нового поведения.
**Trade-offs:** строковый тест не поймает «footer добавлен, но скрыт/не рендерится» — именно поэтому нужен второй слой. Трудозатраты на e2e минимизируются коротким вторым тестом или тремя assertion'ами без интеракций.

**Example:**
```js
// Слой 1 (structure): формат версии закреплён регэкспом
expect(html).toMatch(/data-version="\d+\.\d+\.\d+"/);

// Слой 2 (e2e): только видимость и текст, без интеракций
await expect(about).toContainText("Калькулятор");
```

---

**Ключевое решение (статичный текст vs data-атрибут):** рекомендация — **гибрид**: видимый текст статичен в разметке, а на `<footer>` дополнительно вешается `data-version="X.Y.Z"`. Атрибут даёт тестам стабильный машиночитаемый ключ, статичный текст — то, что реально видит пользователь; дублирование значения (текст + атрибут) — осознанный trade-off однофайлового формата без сборки. Полностью «динамическая» версия (например, чтение версии из `<meta name="version">` через JS) здесь избыточна: она добавляет JS-поверхность и оправдана только при будущем автособирании версии из `package.json`, что исключено стек-констрейнтом фазы.

## Data Flow

### Request Flow

```
[Правка разработчика: поменял версию/текст в calculator.html]
    ↓ (один файл — три потребителя, все читают его независимо)
[structure.test.js: readFileSync → substring/regex]               (мс, Vitest)
[calculator.spec.js: static server → Chrome → DOM → visible/text] (сек, Playwright)
[Пользователь: открытый файл → панель + footer]
```

### State Management

```
[about-line] — константный стейт, зашитый в разметку
  НЕТ: стора, рендера, слушателей, действий
  Единственный мутирующий агент — правка файла человеком
  (будущий bump-скрипт — out of scope фаз 1–2)
```

### Key Data Flows

1. **Логика калькулятора ↔ footer: полностью разделены.** Функции `render()`, `equals()`, слушатели `.keys`/`keydown` не знают о footer; footer не попадает ни в один существующий селектор (`button`, `.keys`, `#display`). Риск регрессии арифметических e2e — нулевой, если footer добавлен вне `.keys` и не является `<button>`.
2. **Текст footer → тесты:** строковый слой парсит тот же `utf8`-текст файла; браузерный слой читает то, что отрендерил Chrome. Из-за отсутствия JS в этой цепочке рассогласование слоёв практически невозможно — рассинхрон возможен только при правке файла между запусками (в CI файл один на оба шага).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Сейчас (1 фаза, 1 файл) | гибрид статичный текст + `data-version`, двухслойные тесты — ровно то, что нужно |
| 2–3 версии и более | помнить, что версия дублируется (текст + атрибут); при росте первое, что стоит сделать — bump-скрипт, меняющий оба вхождения (out of scope фаз 1–2) |
| Множество demo-страниц | вынести footer в шаблон — но это сломает однофайловый инвариант; в контексте этого проекта не рекомендуется |

### Scaling Priorities

1. **First bottleneck:** рассинхронизация версии в двух местах файла — решается тем, что bump делается одним коммитом `feat(calculator): bump version to X.Y.Z` и закрепляется регэксп-тестом.
2. **Second bottleneck:** рост e2e-сьюта (сейчас 1 тест ~3.4s в CI) — не актуально для about-line: рекомендация добавить минимальный проверочник, а не новый тяжёлый файл спеков.

## Anti-Patterns

### Anti-Pattern 1: Рендерить about-line из JS

**What people do:** `document.querySelector(".about").textContent = \`Калькулятор v\${APP_VERSION}\`;`
**Why it's wrong:** фича задумана как чисто статическая; выполняемый JS добавляет точку отказа (упавшая строка кода → пустой footer), при этом строковый структурный тест всё равно проверяет HTML, а не результат выполнения → расслоение тестов; кроме того, любая JS-ошибка ловится существующим `consoleErrors`-проверщиком.
**Do this instead:** писать текст прямо в разметку; JS о footer не знает.

### Anti-Pattern 2: Ставить footer сиблингом `<main>` / проверять видимость по видимому тексту

**What people do:** `<main class="calculator">…</main><footer class="about">…</footer>` на уровне `<body>`; e2e через `page.getByText("Калькулятор")`.
**Why it's wrong:** `body { place-items: center }` рассчитан на одного grid-ребёнка — второй элемент сместит центрирование панели и изменит визуал (заметно на скриншоте глазами, но не тестом); `getByText` хрупок к переименованию приложения.
**Do this instead:** footer внутри `<main>` последним ребёнком; в e2e — только `getByTestId`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Actions (`ci.yml`) | не требует изменений: `npm run lint`, `npm test`, `npm run test:ui` уже прогоняют оба тестовых файла | линтер (`eslint.config.js`) не покрывает `.html` — CSS внутри HTML остаётся вне линтера; husky-хуки не меняются |
| Husky `pre-commit`/`pre-push` | через `npm run lint` + `npm test` (pre-push добавляет `npm test`) | обычный коммит-флоу, Conventional Commits (`feat(calculator): …`) |
| Playwright static server (`tests/ui/server.mjs`) | поднимает `calculator.html` на 127.0.0.1:8123 | footer должен рендериться без сетевых запросов (нет внешних ассетов) — инвариант, закреплённый структурным тестом |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| calculator.html ↔ structure.test.js | текст файла, substring/regex | самая дешёвая проверка; пишется первой и живёт в Vitest suite `npm test` |
| calculator.html ↔ calculator.spec.js | Chrome + DOM (`getByTestId`, `toBeVisible`, `toContainText`) | самый дорогой доступ; по контракту — только видимость/текст, без интеракции |
| calculator.html ↔ docs (фаза 2) | документирование фичи в `docs/about.md`, журнал наблюдений в `docs/memory.md` | оговорено PROJECT.md; связка документационная, не кодовая |

## Sources

- Direct reading of repository files: `calculator.html` (353 строки), `tests/structure.test.js`, `tests/ui/calculator.spec.js`, `docs/about.md`, `docs/memory.md`
- `.planning/PROJECT.md` — стек-констрейнты и 2-фазный план (фаза 1 — фича + тесты, фаза 2 — документация)
- Existing conventions: `data-testid` в существующей разметке; kebab-case CSS-классы; запрет внешних ассетов, закреплённый структурным тестом

---

**Резюме для downstream (roadmap):**

- **Компоненты:** (1) markup+CSS блок about-line внутри `<main class="calculator">`; (2) строковые проверки в `tests/structure.test.js`; (3) e2e-проверка видимости в `tests/ui/calculator.spec.js`; (4) документация (фаза 2).
- **Data flow:** рантайм-передачи данных нет — единственный «поток» это файл `calculator.html`, который независимо читают тесты обоих слоёв и рендерит браузер; JS-слой калькулятора о footer не знает.
- **Порядок сборки:** 1) structure-тест первым (red) → 2) markup `footer class="about" data-testid="about-line" data-version="X.Y.Z"` + CSS (green) → 3) e2e-проверка (`npm run test:ui`) → 4) `npm run lint` + `npm test` + коммит `feat(calculator): …` → 5) фаза 2: docs.
- **Рекомендованный формат:** гибрид статичного текста и `data-version`-атрибута; footer — последний ребёнок `<main>`, чтобы не ломать grid `place-items: center` на `<body>`.

*Architecture research for: single-file calculator demo + about-line footer*
*Researched: 2026-10-25*