# 0006 WASM Modules

## Status

Accepted

## Context

The project definition names DuckDB, libsodium, a local LLM, Whisper, Pandoc, and age. These can be heavy, and some browser runtimes have capability limits.

## Decision

Use lazy-loaded browser modules:

- DuckDB-WASM for local reporting and schedule queries.
- libsodium-wrappers-sumo for symmetric encryption and password-derived sealed exports.
- age-encryption for recipient-oriented encrypted packet compatibility where available.
- pandoc-wasm for document conversion, with HTML/Markdown fallback.
- `@huggingface/transformers` for optional Whisper transcription.
- `@mlc-ai/web-llm` for optional local LLM drafting when WebGPU is available.

DuckDB, libsodium, and age are bundled as lazy chunks because they are central to v1. Pandoc, Whisper, and the local LLM are loaded from pinned public ESM CDN URLs only after explicit user action because bundling their WASM/model runtime artifacts would make the Pages artifact too large for practical day-one publishing. Their work still runs locally in the browser, and the app provides deterministic fallbacks when those modules are unavailable.

## Consequences

Initial payload stays under 200 KB gzipped. Advanced modules can fail independently and show actionable fallback states. GitHub Pages cannot set custom COOP/COEP headers, so any module that requires cross-origin isolation must be gated.

## Alternatives Considered

- Bundle every module on first load: rejected due payload.
- Server-side AI and document conversion: rejected due privacy and Mode A.
