# 0011 Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser logs can leak private care context if overused.

## Decision

Production code avoids routine console logging. Errors are surfaced in the UI with concise messages and optional technical detail. Development-only logs must be guarded by `import.meta.env.DEV`.

## Consequences

No care data is written to logs by default. Debuggability depends on deterministic state exports and tests.

## Alternatives Considered

- Verbose browser logging: rejected due privacy.
- Remote logging: rejected by ADR 0001.
