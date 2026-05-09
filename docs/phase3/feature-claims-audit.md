# Phase 3 Feature Claims Audit

Date: 2026-05-10

## README Claims

| Claim                                     | Status before Phase 3 | Evidence                                                             | Decision                         |
| ----------------------------------------- | --------------------- | -------------------------------------------------------------------- | -------------------------------- |
| Local-first GitHub Pages app              | shipped fully         | Mode A Pages deployment works.                                       | Keep.                            |
| Families coordinate medications           | shipped fully         | Medication schedule and confirmations persist.                       | Keep.                            |
| Appointments                              | shipped fully         | Add/remove appointment and packet inclusion work.                    | Keep.                            |
| Insurance correspondence                  | shipped fully         | Draft facts, deterministic letter, download.                         | Keep and add copy.               |
| Emergency packets                         | shipped fully         | Markdown/HTML/encrypted export works.                                | Keep and add print/state backup. |
| Care data does not move to hosted backend | shipped fully         | No backend; optional modules are public static ESM.                  | Keep.                            |
| Paste messy artifacts and get candidates  | shipped partially     | Text paste works; files/clipboard/share are missing.                 | Finish.                          |
| Confidence-scored candidates              | shipped fully         | Intake candidates show badges.                                       | Keep.                            |
| Activity provenance                       | shipped partially     | Activity log and packet provenance exist; full state export missing. | Finish.                          |

## ADR / Docs Claims

| Claim                                                      | Status before Phase 3 | Evidence                                                 | Decision                  |
| ---------------------------------------------------------- | --------------------- | -------------------------------------------------------- | ------------------------- |
| User data can be backed up by encrypted export             | shipped partially     | Packet can be encrypted, but full care workspace cannot. | Add state export/import.  |
| Static seed data under `public/data/v1` when needed        | quietly cut           | No public data pipeline in Mode A.                       | Clarify docs; not needed. |
| No analytics                                               | shipped fully         | No analytics scripts.                                    | Keep.                     |
| Optional Pandoc/Whisper/LLM modules load after user action | shipped fully         | Dynamic imports are gated by button/file input.          | Keep with honest labels.  |

## Highest-Priority Mismatches

1. README says users can use their real pasted data, but file/clipboard pathways are absent.
2. ADR 0005 mentions backup/export visibility, but full workspace export/import is absent.
3. Packet export has provenance, but users cannot move the whole workspace to another browser.
