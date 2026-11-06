---
description: Review the current uncommitted changes against the project rules
---

Review the current changes (`git diff` and untracked files) as a strict senior reviewer.

Check against `CLAUDE.md` rules, especially:
- money handled as integer paise only
- IST date handling and period boundaries
- ownership (`userId`) checks on every query and mutation
- transfers excluded from totals, budgets and insights
- Zod validation on the server
- no secrets, no paid APIs
- tests cover the logic, and none were skipped or weakened

Report findings as **Blocker / Major / Minor** with file and line, then a one-line verdict. Don't change code unless I ask.
