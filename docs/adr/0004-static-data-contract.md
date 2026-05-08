# 0004 Static Data Contract

## Status

Accepted

## Context

Mode A has no backend and no scheduled data pipeline. The app still needs seed data, schema versions, and predictable import/export formats.

## Decision

Static seed data, when needed, lives under `public/data/v1/` and is copied into `docs/data/v1/` during build. User-owned care data is stored in IndexedDB and exported as schema-versioned JSON:

```json
{
  "schemaVersion": "care-plan.v1",
  "exportedAt": "2026-05-08T00:00:00.000Z",
  "document": {}
}
```

Breaking changes create a new schema version and importer. The app must never fetch or commit real care data.

## Consequences

Exports remain portable and testable. There is no artifact release cadence in v1.

## Alternatives Considered

- SQLite/Parquet static artifacts: deferred until the product needs shared public datasets.
- Runtime REST API: rejected by ADR 0001.
