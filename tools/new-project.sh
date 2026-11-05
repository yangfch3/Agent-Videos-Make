#!/bin/sh
# Usage: tools/new-project.sh <name> | <series>/<ep>
cd "$(dirname "$0")/.." || exit 1
exec uv run python tools/new_project.py "$@"
