# Architecture

## Context

```mermaid
C4Context
  title Elder Care Coordinator Context
  Person(caregiver, "Family caregiver", "Coordinates care tasks, medications, appointments, letters, and packets.")
  System_Ext(github, "GitHub Pages", "Hosts the static app at https://baditaflorin.github.io/elder-care-coordinator/")
  System(app, "Elder Care Coordinator", "Local-first browser app with no runtime backend.")
  System_Ext(packageCdn, "Pinned public ESM CDN", "Optional lazy modules for Pandoc, Whisper, and local LLM runtime code.")
  Rel(caregiver, github, "Loads")
  Rel(github, app, "Serves static assets")
  Rel(app, packageCdn, "Fetches optional advanced modules after user action")
```

## Container

```mermaid
C4Container
  title Elder Care Coordinator Containers
  Person(caregiver, "Family caregiver")
  System_Boundary(browserBoundary, "User browser") {
    Container(pwa, "React PWA", "TypeScript, Vite, Tailwind", "Medication, appointment, family queue, correspondence, and packet UI.")
    ContainerDb(indexeddb, "IndexedDB", "Browser storage", "Yjs update and validated JSON snapshot.")
    Container(duckdb, "DuckDB-WASM", "Lazy WASM", "Local reporting.")
    Container(crypto, "libsodium + age", "Lazy browser crypto", "Encrypted packet export.")
  }
  System_Ext(pages, "GitHub Pages", "Static hosting")
  Rel(caregiver, pwa, "Uses")
  Rel(pages, pwa, "Serves")
  Rel(pwa, indexeddb, "Persists private care plan")
  Rel(pwa, duckdb, "Runs reports")
  Rel(pwa, crypto, "Encrypts exports")
```

## Boundaries

Private care data stays inside the browser unless the user downloads or imports a file. There is no project-owned backend, server log, authentication system, or hosted care database in v1.

Live app: https://baditaflorin.github.io/elder-care-coordinator/

Repository: https://github.com/baditaflorin/elder-care-coordinator
