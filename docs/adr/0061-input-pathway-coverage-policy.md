# 0061 Input Pathway Coverage Policy

## Status

Accepted

## Context

Users bring caregiver data as copied text, files, exports, and clipboard content. GitHub Pages cannot fetch private portal URLs around CORS.

## Decision

Support paste, file upload, drag-drop, multi-file text batching, clipboard read, sample artifact loading, imported state files, and small intake hash links. Detect format from extension and content. For URLs, show static-friendly guidance to paste rendered text or downloaded files.

## Consequences

Real data can enter the app without a backend. Some paths are intentionally honest rather than magical.

## Alternatives Considered

- CORS proxy: rejected because it adds backend trust and can leak private data.
- Folder upload: rejected as unnecessary for the current care artifact workflow.
