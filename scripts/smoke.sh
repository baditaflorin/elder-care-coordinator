#!/usr/bin/env bash
set -euo pipefail

npm run build
SMOKE_ROOT="$(mktemp -d)"
ln -s "$PWD/docs" "$SMOKE_ROOT/elder-care-coordinator"
npx http-server "$SMOKE_ROOT" -p 4173 -c-1 >/tmp/elder-care-coordinator-smoke.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true; rm -rf "$SMOKE_ROOT"' EXIT

node scripts/wait-for-url.mjs http://127.0.0.1:4173/elder-care-coordinator/
node scripts/smoke.mjs
