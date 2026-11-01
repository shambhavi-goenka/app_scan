```bash
#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/scanner/reports"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable"

mkdir -p "$REPORT_DIR"

# Targets are accessed from inside the ZAP Docker container.
VULNERABLE_FRONTEND_URL="http://host.docker.internal:5173"
SECURE_FRONTEND_URL="http://host.docker.internal:5174"
# SECURE_FRONTEND_URL="http://host.docker.internal:4174"

VULNERABLE_API_URL="http://host.docker.internal:3001/api/health"
SECURE_API_URL="http://host.docker.internal:3002/api/health"

run_scan() {
    local name="$1"
    local target="$2"
    local prefix="${name}-${TIMESTAMP}"

    echo
    echo "======================================"
    echo " OWASP ZAP Baseline: $name"
    echo " Target: $target"
    echo "======================================"

    local status=0

    docker run --rm \
        --add-host=host.docker.internal:host-gateway \
        -v "$REPORT_DIR:/zap/wrk/:rw" \
        "$ZAP_IMAGE" \
        zap-baseline.py \
        -t "$target" \
        -m 2 \
        -r "${prefix}.html" || status=$?

    if [ "$status" -gt 2 ]; then
        echo "ERROR: ZAP scan failed for $name (exit code $status)."
        return "$status"
    fi

    echo
    echo "Scan completed: $name"
    echo "ZAP exit code: $status"
    echo "HTML report:"
    echo "  $REPORT_DIR/${prefix}.html"

    if [ "$status" -eq 0 ]; then
        echo "No WARN or FAIL alerts were reported."
    elif [ "$status" -eq 1 ]; then
        echo "ZAP reported WARN alerts. Review the report."
    elif [ "$status" -eq 2 ]; then
        echo "ZAP reported FAIL alerts. Review the report."
    fi
}

echo "Starting OWASP ZAP baseline scans..."

# run_scan "vulnerable-frontend" "$VULNERABLE_FRONTEND_URL"
run_scan "secure-frontend" "$SECURE_FRONTEND_URL"

# run_scan "vulnerable-api" "$VULNERABLE_API_URL"
# run_scan "secure-api" "$SECURE_API_URL"

echo
echo "======================================"
echo " All ZAP baseline scans completed."
echo "Report saved in scanner/reports/"
echo "======================================"
```