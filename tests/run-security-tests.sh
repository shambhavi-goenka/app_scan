#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

MODE="${1:-both}"

run_suite() {
  local app_mode="$1"
  local port="$2"

  echo ""
  echo "======================================"
  echo " Running security tests: $app_mode"
  echo "======================================"

  if ! curl --silent --fail "http://127.0.0.1:$port/api/health" > /dev/null; then
    echo "ERROR: $app_mode backend is not responding on port $port"
    return 1
  fi

  cd "$ROOT_DIR"

  APP_MODE="$app_mode" node --test "$ROOT_DIR"/tests/security/*.test.js
}

case "$MODE" in
  vulnerable)
    run_suite vulnerable 3001
    ;;
  secure)
    run_suite secure 3002
    ;;
  both)
    run_suite vulnerable 3001
    run_suite secure 3002
    ;;
  *)
    echo "Usage: ./tests/run-security-tests.sh [vulnerable|secure|both]"
    exit 1
    ;;
esac

echo ""
echo "All requested security test suites passed."