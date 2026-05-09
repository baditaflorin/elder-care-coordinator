# Phase 3 Codebase Health Audit

Date: 2026-05-10

## Measurements Before Implementation

| Metric                      |    Before | Evidence                                                                                                  |
| --------------------------- | --------: | --------------------------------------------------------------------------------------------------------- |
| Files over 300 lines        |         3 | `src/features/care-plan/CareWorkspace.tsx` 1121, `src/features/intake/infer.ts` 733, `src/index.css` 784. |
| TODO/FIXME/XXX/HACK         |         0 | `rg` found none in source/docs excluding built assets.                                                    |
| `any` occurrences in source |         0 | No source `any`; false positives only fixture text.                                                       |
| Unsafe casts                |         5 | Dynamic import boundaries, fixture JSON cast, correspondence topic cast, build info `as const`.           |
| Dead UI controls            | 0 obvious | All visible controls have handlers; gaps are missing pathways rather than stubs.                          |
| Test files                  |         3 | Planner, intake inference fixtures, intake apply.                                                         |

## DRY Violations

| Area                              | Files / lines                                          | Finding                                             | Decision                                   |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------ |
| Download/copy/export behavior     | `CareWorkspace.tsx` packet and correspondence sections | Downloads are ad hoc; no copy/state export helpers. | Add shared clipboard/state export helpers. |
| Date formatting in UI and packet  | `planner.ts`, `CareWorkspace.tsx`                      | Mostly centralized; no action.                      | Keep.                                      |
| Intake candidate field formatting | `CareWorkspace.tsx` local helpers                      | UI-only and isolated.                               | Keep unless panel is extracted.            |

## SOLID Violations

| Module              | Finding                                                                                                      | Decision                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `CareWorkspace.tsx` | God module: shell, dashboard, intake, medications, appointments, correspondence, packet, family, formatting. | Extract intake and settings/state management components or helpers during Phase 3. |
| `infer.ts`          | Large domain parser, but locked by Phase 2 "no engine changes."                                              | Document accepted until Phase 4.                                                   |
| `index.css`         | Large global stylesheet; no CSS module boundary.                                                             | Leave unless new CSS can be scoped by class.                                       |

## Type Safety Holes

| Location                                   | Finding                                      | Decision                                              |
| ------------------------------------------ | -------------------------------------------- | ----------------------------------------------------- |
| `src/features/care-plan/CareWorkspace.tsx` | `event.target.value as CorrespondenceTopic`. | Replace with zod parse/helper.                        |
| `src/features/intake/infer.test.ts`        | JSON fixture cast.                           | Replace with zod schema validation.                   |
| Dynamic module imports                     | Type assertions at WASM/CDN boundaries.      | Mark as explicit boundary and narrow where practical. |

## Persistence Holes

| Location       | Finding                                                     | Decision                              |
| -------------- | ----------------------------------------------------------- | ------------------------------------- |
| `careStore.ts` | No explicit migration helper or import/export state format. | Add migration and state-file helpers. |
| UI             | Reset exists but no state export/import/settings reset.     | Add Settings tab.                     |

## Test Coverage Holes

1. Full state export/import round-trip is not tested.
2. Clipboard/share/print paths are not smoke-tested.
3. File upload/drag-drop pathways are not smoke-tested.
4. Settings persistence is not tested.
