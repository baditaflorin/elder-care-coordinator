#!/usr/bin/env bash
set -euo pipefail

npm run build
node scripts/smoke.mjs
