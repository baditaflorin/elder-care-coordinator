# 0010 GitHub Pages Publishing

## Status

Accepted

## Context

The live GitHub Pages URL is a first-class deliverable from day one. Documentation must also live under `docs/`.

## Decision

Publish from the `main` branch `/docs` folder. Vite builds the app into `docs/` with `emptyOutDir: false` so Markdown documentation and ADRs remain in place. Hashed assets are emitted under `docs/assets/`. `docs/404.html` mirrors `docs/index.html` for SPA fallback. `docs/.nojekyll` disables Jekyll processing.

## Consequences

The Pages directory is committed and intentionally not ignored. Stale generated assets should be cleaned when needed during release preparation. The Vite base path is `/elder-care-coordinator/`.

## Alternatives Considered

- `gh-pages` branch: viable, but it would hide the live artifact from normal review.
- Repository root: rejected because it would mix source and generated assets more aggressively.
