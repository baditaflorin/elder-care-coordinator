# Data Contract

Mode A has no scheduled data pipeline and no shared public dataset.

User-owned care data is stored in IndexedDB as:

- a Yjs binary update for local-first collaboration/import foundations
- a validated JSON snapshot for recovery and migration

Exports use schema version `care-plan.v1`.

```json
{
  "schemaVersion": "care-plan.v1",
  "createdAt": "2026-05-08T08:00:00.000Z",
  "updatedAt": "2026-05-08T08:00:00.000Z",
  "recipient": {},
  "caregivers": [],
  "medications": [],
  "appointments": [],
  "tasks": [],
  "correspondence": [],
  "notes": [],
  "emergencyInstructions": ""
}
```

Real care data must not be committed to the repository.
