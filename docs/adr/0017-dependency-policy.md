# 0017 Dependency Policy

## Status

Accepted

## Context

The app includes healthcare-adjacent workflows, encryption, WASM, and offline storage.

## Decision

Prefer production-ready, maintained libraries over custom implementations. Pin via `package-lock.json`. Run `npm audit` and keep high/critical vulnerabilities out of committed dependencies. Heavy dependencies must be lazy-loaded unless they are required for first paint.

## Consequences

Security and maintenance are easier to reason about. Bundle budget remains an active review concern.

## Alternatives Considered

- Hand-roll cryptography, sync, SQL, or document conversion: rejected.
