# Privacy

Elder Care Coordinator v0.1.0 has no analytics, no hosted backend, and no project-owned telemetry endpoint.

Private care data is stored in the user's browser through IndexedDB. Optional downloads, Markdown files, HTML packets, and encrypted age files are created only after the user clicks an export action.

Optional advanced modules for Pandoc, Whisper transcription, and local LLM drafting are fetched from pinned public ESM CDN URLs only after explicit user action. The intended computation runs in the browser. Users should avoid those optional actions on networks or devices where fetching third-party module code is not acceptable.

Live app: https://baditaflorin.github.io/elder-care-coordinator/

Repository: https://github.com/baditaflorin/elder-care-coordinator
