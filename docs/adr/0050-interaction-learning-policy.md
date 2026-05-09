# 0050 Interaction Learning Policy

## Status

Accepted

## Context

Corrections should help within the session without creating surprising hidden behavior.

## Decision

Remember lightweight correction preferences in session/local UI state only: preferred medication times for inferred BID/daily schedules and ignored candidate IDs during the current review. Do not train models or sync corrections.

## Consequences

The app feels less repetitive while keeping behavior inspectable and local.

## Alternatives Considered

Persistent opaque learning was rejected because it could surprise users in a high-stakes domain.
