#!/usr/bin/env bash
set -euo pipefail
FETCH_USER="${1:-$SUDO_USER}"
if [[ -z "${FETCH_USER:-}" ]]; then echo "Usage: sudo $0 <fetch-user>"; exit 2; fi
RUNTIME=/opt/iobroker/fitdays-sync
install -d -o "$FETCH_USER" -g iobroker -m 2750 "$RUNTIME"
echo "Created $RUNTIME owner=$FETCH_USER group=iobroker mode=2750"
echo "New files inherit group iobroker; ioBroker can read them, fetch user can write them."
