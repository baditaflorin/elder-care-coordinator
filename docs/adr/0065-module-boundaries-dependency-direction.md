# 0065 Module Boundaries And Dependency Direction

## Status

Accepted

## Context

The frontend uses feature folders, but `CareWorkspace.tsx` currently owns several workflows.

## Decision

Keep dependency direction as UI -> feature application helpers -> domain schemas/storage -> shared primitives. New state/settings/input/output helpers live outside the monolithic workspace component. UI may import helpers; helpers must not import UI.

## Consequences

New completeness code has clean boundaries. Existing large files are reduced where it directly helps Phase 3.

## Alternatives Considered

- Full component decomposition: deferred to a refactor phase.
