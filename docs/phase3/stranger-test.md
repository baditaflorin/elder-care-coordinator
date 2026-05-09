# Phase 3 Stranger Test

Date: 2026-05-10

Tester: fresh Playwright browser context, using a real fixture file as a substitute because autonomous execution did not include another human.

Input used: `test/fixtures/realdata/04-prescription-label-sig.txt`

## Walkthrough

1. Opened the Pages build in a fresh browser context.
2. Loaded a real prescription-label text fixture through the file picker.
3. Reviewed the artifact and confirmed the app inferred Amoxicillin.
4. Applied the selected candidate to the local care plan.
5. Confirmed the medication appeared in the Medications tab.
6. Added Vitamin D manually to verify ordinary form input still works.
7. Opened the Packet tab and verified the emergency packet rendered.
8. Opened Settings, chose a default caregiver, exported workspace JSON, reset to sample, imported the exported state, and confirmed Vitamin D returned.

## Confusions And Fixes

| Finding                                         | Response                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| File entry was not obvious enough in v0.2.      | Added drop zone, Choose files, clipboard read, and sample artifact controls. |
| A user could not back up or move the workspace. | Added Settings export/import with versioned state JSON and smoke coverage.   |
| Packet printing required manual download/open.  | Added Print packet button.                                                   |

## Result

The stranger workflow now passes for a real file-based input and state round-trip. It still does not support OCR/photo input or direct private portal URL fetching; those are documented limitations rather than hidden failures.
