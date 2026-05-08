# Elder Care Coordinator

![Mode A static](https://img.shields.io/badge/deployment-Mode%20A%20static-135e75)
![GitHub Pages](https://img.shields.io/badge/live-GitHub%20Pages-0f766e)
![Version](https://img.shields.io/badge/version-0.1.0-334155)

Live site: https://baditaflorin.github.io/elder-care-coordinator/

Repository: https://github.com/baditaflorin/elder-care-coordinator

Elder Care Coordinator is a local-first GitHub Pages app for families coordinating medications, appointments, insurance correspondence, and emergency packets without moving private care data to a hosted backend.

![Elder Care Coordinator dashboard](docs/screenshot.png)

## Quickstart

```bash
npm install
make install-hooks
make dev
make build
make smoke
```

## Architecture

```mermaid
flowchart LR
  Family["Family caregivers"] --> Pages["GitHub Pages static app"]
  Pages --> Browser["Browser runtime"]
  Browser --> IDB["IndexedDB / OPFS"]
  Browser --> WASM["Lazy WASM modules"]
  Browser --> Exports["Encrypted / printable exports"]
```

## Links

Live site: https://baditaflorin.github.io/elder-care-coordinator/

GitHub repository: https://github.com/baditaflorin/elder-care-coordinator

Support via PayPal: https://www.paypal.com/paypalme/florinbadita

Architecture docs: https://github.com/baditaflorin/elder-care-coordinator/tree/main/docs

ADRs: https://github.com/baditaflorin/elder-care-coordinator/tree/main/docs/adr

Privacy: https://github.com/baditaflorin/elder-care-coordinator/blob/main/docs/privacy.md
