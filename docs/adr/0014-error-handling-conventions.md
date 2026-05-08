# 0014 Error Handling Conventions

## Status

Accepted

## Context

The app has storage, import/export, encryption, and optional WASM modules that can fail for user-actionable reasons.

## Decision

Feature logic returns typed result objects or throws typed errors at boundaries. UI catches errors at feature boundaries and shows concise recovery actions. Validation uses zod. Production errors must not include private care values.

## Consequences

Care workflows can degrade gracefully. Tests can assert failures without string-matching internals.

## Alternatives Considered

- Panic-style unrecoverable errors: rejected.
- Silent failures: rejected.
