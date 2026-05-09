# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Scope: §0 baseline plus Phase 2 completion evidence.

Live v1 audited: https://baditaflorin.github.io/elder-care-coordinator/

Repository: https://github.com/baditaflorin/elder-care-coordinator

## Fixture Candidates

These are real-world caregiver-style inputs selected as the Phase 2 grading rubric. Public examples were used to avoid committing private health information.

| #   | Input                                                                                                         | Source                                                                                                                                                            | Messiness                            | What v1 did                                                                                                                           | What it should have done                                                                                                  | Failure mode                                               | Manual work v1 forced                                                   |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Patient-friendly medication list PDF/table with columns for medication, amount, frequency, and comments       | https://professionals.wrha.mb.ca/old/professionals/primary-care-providers/files/SAMPLEPatientFriendly.pdf                                                         | Clean                                | No upload/paste path. User must retype every medication into Add Medication.                                                          | Parse rows, infer name/dose/frequency/purpose, show confidence, ask for corrections inline.                               | Obvious missing capability                                 | Retype every row, split dose vs frequency, choose times manually.       |
| 2   | AHRQ medication list / medication-at-transitions worksheet                                                    | https://www.ahrq.gov/sites/default/files/publications/files/match.pdf                                                                                             | Mildly messy                         | Same as #1; no concept of last dose or route.                                                                                         | Preserve route, last-dose, and transition metadata; warn that route/last-dose do not map cleanly to v1 medication fields. | Silent loss if user manually compresses data into notes    | Decide what to omit and where to place metadata.                        |
| 3   | Medication reconciliation discharge sample where new discharge orders supersede prior home orders             | https://www.mass.gov/doc/section-08-medication-reconciliation-discharge-hcp-orders-checklist-sample-0/download                                                    | Genuinely messy                      | No reconciliation logic. User can accidentally enter both old and new orders.                                                         | Detect duplicates/changes, classify start/stop/continue, surface conflicts and superseded meds.                           | Wrong-but-confident emergency packet if duplicates remain  | Compare lists manually and decide which order wins.                     |
| 4   | Prescription-label sig text: “Take 1 tablet by mouth twice daily” and related ambiguous directions            | https://toledofamilypharmacy.com/understanding-your-prescription-label/ and https://hellopharmacist.com/questions/two-tablets-at-the-same-time-or-one-twice-daily | Mildly messy                         | User has to convert directions into fixed times manually.                                                                             | Infer BID as roughly every 12 hours, detect ambiguity, propose 8 AM / 8 PM with low/medium confidence.                    | Obvious manual translation; possible wrong schedule        | Interpret sig language and choose exact times.                          |
| 5   | Weird/adversarial pharmacy sigs from real pharmacy discussions: double sigs, PRN, conflicting route/frequency | https://www.reddit.com/r/CVS/comments/1fz0der and https://www.reddit.com/r/pharmacy/comments/165uon3                                                              | Adversarial                          | No sig parser, no ambiguity flag, no safety warning.                                                                                  | Refuse confident schedule when directions conflict; mark as “needs pharmacist/clinician clarification.”                   | Would become wrong-confident if user forces it into fields | Notice contradictions and avoid creating a bad schedule.                |
| 6   | CMS sample Medicare Summary Notice with multiple claim lines and appeal context                               | https://www.cms.gov/MSN                                                                                                                                           | Genuinely messy                      | User can draft a letter only after manually extracting facts. Draft omits claim-line structure, dates, and reason codes unless typed. | Extract provider, claim date, amount, denied item, appeal deadline/instructions, and confidence per field.                | Wrong-but-confident letter if key facts missing            | Read PDF, identify denial lines, paste facts, keep deadlines elsewhere. |
| 7   | Insurance denial appeal examples and denial reasons                                                           | https://www.insurance.wa.gov/insurance-resources/health-insurance/appealing-health-insurance-denial/common-reasons-denial-and-examples-appeal-letters             | Clean to messy                       | Draft template works only after manual topic/facts entry; no denial-reason classification.                                            | Classify denial reason, identify needed supporting documents, produce a first draft with missing-info checklist.          | Partly obvious, partly wrong-confident                     | Choose appeal type and know which documents matter.                     |
| 8   | Prior authorization denial appeal template for medication/service                                             | https://www.patientadvocate.org/download-view/sample-appeal-letter-for-pre-authorization-denial/                                                                  | Mildly messy                         | User can paste facts, but the app does not distinguish medication, service, denial date, reference number, or urgency.                | Extract PA denial fields and generate a structured draft plus missing-field warnings.                                     | Wrong-but-confident draft                                  | Map denial letter to administrative fields manually.                    |
| 9   | Appointment reminder email / ICS style healthcare reminder                                                    | https://help.icehealthsystems.com/schedule/send-appointment-reminders                                                                                             | Mildly messy                         | User must manually add clinician, date, location, prep, and follow-up. Time zones are not explained.                                  | Parse date/time/location from pasted email or ICS, preserve timezone/source, create appointment guess.                    | Obvious manual work; possible timezone error               | Copy appointment fields one by one.                                     |
| 10  | WhatsApp-style family medication reminder / response thread                                                   | https://www.parwah.co/                                                                                                                                            | Genuinely messy partial conversation | User can only add a note manually; no extraction of “taken,” missed response, task owner, or med status.                              | Parse caregiver messages into note/task/med confirmation candidates with confidence and timestamps.                       | Silent loss of structured action                           | Translate chat into confirmations, tasks, and notes.                    |

## After Implementation

Fixture suite: `src/features/intake/infer.test.ts`

Command: `npx vitest run src/features/intake/infer.test.ts --reporter=verbose`

Result on 2026-05-09: 10/10 real-data fixtures pass, plus empty, huge, and encoding-weird synthetic edge cases.

| #   | After behavior                                                                                               | Pass |
| --- | ------------------------------------------------------------------------------------------------------------ | ---- |
| 1   | Detects medication-list rows and extracts Metformin, Lisinopril, and Apixaban candidates.                    | yes  |
| 2   | Detects transition-of-care context, extracts home/start/stop/continue meds, and warns on stopped meds.       | yes  |
| 3   | Detects discharge reconciliation, flags changed Lisinopril dose and discontinued meds.                       | yes  |
| 4   | Parses prescription sig into a medication candidate and maps twice-daily directions to default review times. | yes  |
| 5   | Detects prescription label shape and marks conflicting Gabapentin directions as ambiguous.                   | yes  |
| 6   | Extracts MSN/denial reference, denied service, appeal deadline, and correspondence draft facts.              | yes  |
| 7   | Classifies prior-authorization denial and creates a supporting-document task.                                | yes  |
| 8   | Extracts PA reference, medication/service, step therapy reason, draft, and supporting-document task.         | yes  |
| 9   | Extracts appointment reminder date/time, clinician, location, preparation, and timezone warning.             | yes  |
| 10  | Extracts family-chat notes, tasks, med confirmation, and appointment handoff candidates.                     | yes  |

## Top 5 Logic Gaps

1. No ingestion layer: v1 has no paste/upload/import path for the artifacts caregivers already have.
2. No medication sig parser: directions like BID, PRN, “2 tablets daily,” and conflicting route/frequency are not interpreted or flagged.
3. No reconciliation engine: discharge meds, old meds, stopped meds, duplicates, and changed doses are not compared.
4. No document intelligence for insurance: denial reasons, claim IDs, appeal deadlines, and missing enclosures are not extracted.
5. Exports lack confidence/provenance: emergency packets and drafts look complete even when built from partial manual entry.

## Top 3 Intuition Failures

1. A caregiver expects to paste/upload an existing medication list first; the app starts from manual form entry.
2. The emergency packet looks authoritative even if it only contains the sample/default or partially-entered data.
3. Insurance draft generation feels helpful but does not say which required denial fields are missing.

## Top 3 “Feels Stupid” Moments

1. User must translate “take 1 tablet twice daily” into exact schedule times.
2. User must manually identify that a discharge order replaces an older home medication order.
3. User must read an MSN/denial letter and hand-pick claim facts the app should extract.

## What Smart Means For This Product

- Paste/upload a med list, label text, or discharge med section and immediately get a proposed medication schedule with confidence and correction points.
- Paste/upload an insurance denial/MSN and immediately get extracted claim facts, appeal deadlines, denial reason, missing-info checklist, and a draft.
- Paste an appointment reminder or family chat and get candidate appointments, tasks, notes, or med confirmations without configuring fields first.
- Refuse silent certainty: ambiguous or conflicting care instructions are flagged as “needs clarification,” not turned into confident schedules.
- Every export includes source, schema version, app version, generated-at, confidence, and unresolved warnings.

## Phase 2 Substance Success Metrics

- Real-data pass rate: at least 7 of 10 fixtures produce a useful first guess with no manual intervention beyond correction.
- Determinism: identical fixture input produces byte-identical normalized output in 100% of fixture tests.
- No silent wrongness: every low-confidence or conflicting inference surfaces a warning in UI and export.
- Median paste-to-preview time under 1 second for the 10 fixture set; p95 under 3 seconds; no UI freeze over 300 ms without progress.
- Every failure message includes what failed, why in caregiver/domain terms, and a next step.
- Export/re-import of normalized care-plan state preserves stable IDs and all inferred warnings.

## Explicit Out Of Scope

- No runtime backend, auth, cloud sync, or architecture mode change.
- No new product surface area beyond the existing domains: meds, appointments, family notes/tasks, correspondence, packet/export.
- No visual polish, dark mode, command palette, skeleton loaders, or marketing work.
- No medical advice, interaction checking, diagnosis, clinical decision support, or automated insurer submission.
- No Phase 2 ADRs, fixtures, picklist, or implementation until confirmation.
