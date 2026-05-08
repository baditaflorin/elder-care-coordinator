# Postmortem

## What Was Built

Built a Mode A GitHub Pages app for local-first elder-care coordination:

- medication schedule and confirmation handoff
- appointment tracking and prep notes
- family task queue and notes
- insurance correspondence drafting with optional local LLM polish
- voice-note transcription hook with optional Whisper runtime
- emergency packet preview, Markdown/HTML export, and age encrypted export
- IndexedDB + Yjs persistence
- DuckDB-WASM local reporting
- local hooks, tests, smoke checks, and Pages publishing from `main / docs`

## Was Mode A Correct?

Yes. V1 does not need hosted auth, server mutation state, or backend secrets. The only pressure toward Mode C is real-time cross-device family sync, and that was explicitly kept out of scope. Mode B also was unnecessary because there is no scheduled public data artifact.

## What Worked

GitHub Pages was enough for the core workflow. IndexedDB plus Yjs gives a practical local-first base. DuckDB, age, and libsodium can stay lazy-loaded while the first page remains fast.

## What Did Not Work

Bundling Pandoc, Whisper, and local LLM packages directly into the Pages build was too heavy for a day-one static artifact and stressed local disk space. Those advanced modules now load from pinned public ESM CDN URLs after explicit user action, with deterministic fallback behavior.

## Surprises

The generated build metadata initially made every pre-push build dirty because the current git commit changed the hashed frontend bundle. The fix was a committed build-info module that shows the source commit used for the Pages artifact.

## Accepted Tech Debt

- The optional AI/document modules need stronger offline packaging if this becomes a production caregiver tool.
- The emergency packet is HTML/Markdown-first; PDF-quality pagination is future work.
- Encrypted sharing is export/import oriented, not live multi-device sync.

## Next Improvements

1. Add encrypted import and merge conflict review for family handoffs.
2. Package optional Pandoc/Whisper/LLM assets as versioned release artifacts instead of CDN modules.
3. Add medication interaction/reference checks only if a safe, well-sourced, non-diagnostic dataset is selected.

## Time

Estimated v1 scaffold and usable prototype: 4-6 focused hours.

Actual implementation pass: roughly 2 hours, with the main extra time spent on Pages build determinism and smoke-test reliability.
