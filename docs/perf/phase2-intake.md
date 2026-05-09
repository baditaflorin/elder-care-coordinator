# Phase 2 Intake Performance

Date: 2026-05-09

Command:

```sh
npx vitest run src/features/intake/infer.test.ts --reporter=verbose
```

Environment: local development machine, Node/Vitest runner. Browser smoke testing separately verifies the Pages build and one paste-to-apply path.

| Fixture                           | Duration |
| --------------------------------- | -------: |
| 01-clean-med-list.txt             |    25 ms |
| 02-transition-worksheet.txt       |     2 ms |
| 03-discharge-conflict.txt         |     1 ms |
| 04-prescription-label-sig.txt     |     1 ms |
| 05-adversarial-sig.txt            |     0 ms |
| 06-medicare-summary-notice.txt    |     1 ms |
| 07-insurance-denial.txt           |     1 ms |
| 08-prior-authorization-denial.txt |     0 ms |
| 09-appointment-reminder.txt       |    42 ms |
| 10-family-chat.txt                |    16 ms |

Median fixture time: 1 ms.

P95 fixture time: 42 ms.

Worst fixture time: 42 ms.

Synthetic robustness case: empty, huge, and encoding-weird inputs completed in 151 ms. The huge input crosses the 1 MB safety budget and returns a `too-large` warning without generating candidates.

## Budget Result

- Under 300 ms progress threshold for all real-data fixtures.
- Under 1 second median paste-to-preview target.
- Under 3 second p95 target.
- No fixture performs network calls or runtime backend work.
