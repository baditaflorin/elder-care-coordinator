# Privacy

Elder Care Coordinator v0.3.0 has no analytics, no hosted backend, and no project-owned telemetry endpoint.

Private care data is stored in the user's browser through IndexedDB. Optional downloads, workspace JSON files, Markdown files, HTML packets, print views, clipboard copies, small artifact hash links, and encrypted age files are created only after the user clicks an action.

Workspace JSON exports and small artifact links may contain sensitive care details. Keep them private and share only with people who should see the care information.

Optional advanced modules for Pandoc, Whisper transcription, and local LLM drafting are fetched from pinned public ESM CDN URLs only after explicit user action. The intended computation runs in the browser. Users should avoid those optional actions on networks or devices where fetching third-party module code is not acceptable.

Live app: https://baditaflorin.github.io/elder-care-coordinator/

Repository: https://github.com/baditaflorin/elder-care-coordinator
