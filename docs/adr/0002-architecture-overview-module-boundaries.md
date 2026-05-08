# 0002 Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The product needs medication planning, appointment tracking, family coordination, document drafting, encryption, exports, and offline operation without a server.

## Decision

Use a feature-oriented frontend architecture:

- `src/features/care-plan`: care profile, medications, appointments, contacts, tasks, correspondence, and packet composition.
- `src/features/storage`: IndexedDB persistence, Yjs document encoding, import/export.
- `src/features/crypto`: libsodium sealed exports and age-compatible packet helpers.
- `src/features/assistant`: local draft generation, Whisper transcription, and template fallback.
- `src/features/analytics`: local DuckDB-WASM reporting only.
- `src/shared`: UI, validation, build metadata, and cross-feature utilities.

## Consequences

Each domain owns its logic and tests. Shared code remains small and boring. Heavy modules stay out of the initial route and are dynamically imported.

## Alternatives Considered

- Layered MVC directories: rejected because the app is feature-heavy and benefits from local ownership.
- Backend-centered modules: rejected by ADR 0001.
