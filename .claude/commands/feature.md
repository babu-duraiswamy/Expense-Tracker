---
description: Plan and build one feature from docs/FEATURES.md (e.g. /feature F-TXN-01)
argument-hint: <feature-id>
---

Work on feature **$ARGUMENTS**.

1. Read `$ARGUMENTS` in `docs/FEATURES.md` and every FR/NFR it references in `docs/RAD.md`. Check its dependencies are marked done; if not, stop and tell me.
2. Before writing code, give me a short plan:
   - files to create or change
   - schema/migration changes (if any)
   - tests you will write
   - anything ambiguous I need to decide
   Then wait for my go-ahead.
3. Build it following every rule in `CLAUDE.md`. Write the pure-logic tests first.
4. Run `npm run check` (plus `npm run test:e2e` if a UI flow changed) and fix failures without weakening tests.
5. Tick the acceptance-criteria boxes for `$ARGUMENTS` in `docs/FEATURES.md` and set its Status to ☑.
6. Summarise what you built, explain any part a learner might find tricky, and suggest a commit message.
