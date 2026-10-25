---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "docs/about.md:15 — устаревший счётчик «48 сценариев» для e2e-прав (фактически 51); динамический counter-гейт фазы защищал только строку 55"
  - id: IN-01
    severity: info
    disposition: open
    title: "docs/memory.md:39 — «+5 about-line-ассертов» при фактической дельте +4 it-блока (наличие/единственность — один it)"
open: 2
total: 2
recorded: 2026-10-25T14:01:25.864Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| IN-01 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
