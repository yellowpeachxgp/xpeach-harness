#!/usr/bin/env bash
# 🍑Code — XPeach launcher.
# Boots the whitelabeled DSH web app on the xpeach profile.
# Usage: ./start-xpeach.sh [--open]
set -euo pipefail

DSH_ROOT="/Volumes/SN 770/Developer/deepseek-harness"
PORT=3080

# Free the port from a stale run (the CLI does not reclaim it on crash).
PID=$(lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t || true)
if [[ -n "${PID}" ]]; then
  echo "Freeing :${PORT} (pid ${PID})"
  kill ${PID} || true
  sleep 1
fi

cd "${DSH_ROOT}"
if [[ "${1:-}" == "--open" ]]; then
  exec pnpm dsh --profile xpeach
else
  exec pnpm dsh --profile xpeach --no-open
fi
