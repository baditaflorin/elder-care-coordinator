# 0012 Metrics And Observability

## Status

Accepted

## Context

The app handles sensitive family-care data and has no backend.

## Decision

No analytics are enabled in v1. No client beacon, Plausible script, or third-party analytics script is shipped.

## Consequences

There is no usage telemetry. Product decisions rely on user feedback, issues, and local testing.

## Alternatives Considered

- Privacy-respecting analytics: deferred until there is a clear need and explicit opt-in.
