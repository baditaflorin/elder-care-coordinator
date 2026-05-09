# 0066 Error-Handling Convention

## Status

Accepted

## Context

Browser actions fail for user-correctable reasons: permission denied, unsupported files, invalid JSON, unavailable optional modules.

## Decision

Every UI action catches unknown errors, narrows them, and reports what failed plus a next step in domain language. Shared helpers throw typed `Error` messages that are already user-safe.

## Consequences

No stack traces or implementation terms leak into production UI.

## Alternatives Considered

- Silent console logging: rejected because the app handles high-stakes caregiver workflows.
