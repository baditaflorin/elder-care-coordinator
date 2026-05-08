# 0001 Deployment Mode

## Status

Accepted

## Context

The default project constraint is GitHub Pages first. The app coordinates sensitive elder-care information, so every hosted service becomes a privacy, security, and operations burden. The v1 requirements can be satisfied with browser storage, WebAssembly, local exports, and user-driven encrypted sharing.

## Decision

Use Mode A: Pure GitHub Pages.

The app is a static React/Vite PWA served from GitHub Pages. Private care data stays in the browser using IndexedDB and, where available, OPFS-backed browser storage. Collaboration is local-first through Yjs document updates, export/import, and encrypted packet sharing. Heavy capabilities such as DuckDB-WASM, libsodium, age-compatible encryption, Pandoc-WASM, Whisper transcription, and local LLM drafting are loaded lazily behind explicit user actions.

## Consequences

- No backend, runtime database, server auth, Docker image, nginx deployment, Prometheus endpoint, or hosted secrets are needed in v1.
- Cross-device real-time sync is intentionally out of scope for v1.
- Browser capability differences must be handled with graceful fallback UI.
- GitHub Pages headers cannot enable arbitrary cross-origin isolation, so WASM features must work without custom response headers or clearly explain the limitation to the user.

## Alternatives Considered

- Mode B: rejected for v1 because there is no shared public dataset or scheduled data artifact required.
- Mode C: rejected for v1 because runtime auth and hosted mutations would increase risk before real-time sync is proven necessary.
