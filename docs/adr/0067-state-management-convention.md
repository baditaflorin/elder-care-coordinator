# 0067 State-Management Convention

## Status

Accepted

## Context

Care-plan data is sensitive and durable. UI preferences are non-sensitive and can live separately.

## Decision

Care plans stay in IndexedDB/Yjs and full state JSON files. Non-sensitive UI settings use localStorage through a typed settings hook. Transient intake review state stays in component state.

## Consequences

Persistence boundaries stay clear and testable.

## Alternatives Considered

- Store settings in the care plan: rejected because settings are per-browser preferences, not care facts.
