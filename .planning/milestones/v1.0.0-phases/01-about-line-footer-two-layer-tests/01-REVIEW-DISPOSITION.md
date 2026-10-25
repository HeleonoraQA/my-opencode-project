---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Last-child assertion проходит зелёным, когда footer вынесен СИБЛИНГОМ за пределы `<main>` (слепая зона whitespace-механики)"
  - id: IN-01
    severity: info
    disposition: open
    title: "Видимый текст footer проверяется только substring-ассертами — дополнительный «мусорный» текст в footer остаётся зелёным"
  - id: IN-02
    severity: info
    disposition: open
    title: "Хрупкие null-разыменования в match-ассертах — crash вместо читаемого сообщения при падении"
  - id: IN-03
    severity: info
    disposition: open
    title: "Негативный regex неинтерактивности пропускает `<abbr>`/`<area>` (word-boundary после `a`)"
open: 3
total: 4
recorded: 2026-10-25T11:23:05.342Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 01-REVIEW-FIX.md |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
