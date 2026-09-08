#!/usr/bin/env bash
# Human-run entry point. Tests import the helpers; agents never execute this file.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
exec python3 -B scripts/deploy.py "$@"
