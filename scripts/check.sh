#!/usr/bin/env bash
# The PR checks, the same locally and in CI: the marketplace and every plugin validated with
# --strict (warnings fail), and every plugin that has tests runs them. No credentials needed.
set -euo pipefail
cd "$(dirname "$0")/.."

claude plugin validate . --strict
for dir in plugins/*/; do
  claude plugin validate "$dir" --strict
  if [[ -d "$dir/tests" ]]; then
    claude plugin test "$dir"
  fi
done
