# 0069 Type-Safety Policy At Boundaries

## Status

Accepted

## Context

Dynamic imports, JSON, browser APIs, and DOM events are boundary code. Internal app code should not rely on unsafe casts.

## Decision

Validate JSON with zod, narrow browser errors before display, parse enum form values with schemas, and mark dynamic ESM/WASM adapters as explicit boundary modules.

## Consequences

Unsafe casts become localized and intentional.

## Alternatives Considered

- Ban all casts: rejected because dynamic WASM/CDN modules require typed adapter boundaries.
