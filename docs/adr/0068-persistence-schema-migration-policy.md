# 0068 Persistence Schema And Migration Policy

## Status

Accepted

## Context

IndexedDB snapshots and exported state files must survive app upgrades.

## Decision

Use versioned app-state JSON with zod validation. Add a migration boundary for old care-plan snapshots and tolerate Phase 2 data without activity logs. Import validates before replacing local state.

## Consequences

Old data is migrated or rejected with an actionable message instead of silently corrupting state.

## Alternatives Considered

- Trust JSON imports: rejected because external files are untrusted boundaries.
