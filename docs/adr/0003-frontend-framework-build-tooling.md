# 0003 Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs a polished offline UI, strict TypeScript, lazy chunks, a PWA service worker, and a Pages-compatible build.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, lucide-react, TanStack Query, zod, Vitest, and Playwright.

## Consequences

Vite handles hashed assets and fast builds. React keeps complex stateful screens approachable. Tailwind keeps styling local and consistent. TanStack Query remains available for static artifact and local async module caching even without a backend.

## Alternatives Considered

- SvelteKit static output: viable, but React has broader ecosystem coverage for the chosen libraries.
- Plain TypeScript without a framework: rejected because the app has multiple interactive workflows.
