
#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/scanner/reports/OWASP ZAP reports"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable"

mkdir -p "$REPORT_DIR"

# Frontend targets
VULNERABLE_FRONTEND_URL="http://host.docker.internal:5173"
SECURE_FRONTEND_URL="http://host.docker.internal:5174"
# SECURE_FRONTEND_URL="http://host.docker.internal:4174" #for prod version 

# Backend targets
VULNERABLE_API_URL="http://host.docker.internal:3001/api/health"
SECURE_API_URL="http://host.docker.internal:3002/api/health"

run_scan() {
    local name="$1"
    local target="$2"
    local prefix="${name}-${TIMESTAMP}"
    local status=0

    echo
    echo "======================================"
    echo " OWASP ZAP Baseline: $name"
    echo " Target: $target"
    echo "======================================"

    docker run --rm \
        --add-host=host.docker.internal:host-gateway \
        -v "$REPORT_DIR:/zap/wrk/:rw" \
        "$ZAP_IMAGE" \
        zap-baseline.py \
        -t "$target" \
        -m 2 \
        -w "${prefix}.md" || status=$?

    if [ "$status" -gt 2 ]; then
        echo "ERROR: ZAP scan failed for $name (exit code $status)."
        return "$status"
    fi

    echo
    echo "Scan completed: $name"
    echo "ZAP exit code: $status"
    echo "Markdown report:"
    echo "  $REPORT_DIR/${prefix}.md"

    case "$status" in
        0)
            echo "No WARN or FAIL alerts were reported."
            ;;
        1)
            echo "ZAP reported WARN alerts. Review the report."
            ;;
        2)
            echo "ZAP reported FAIL alerts. Review the report."
            ;;
    esac
}

echo "Starting OWASP ZAP baseline scans..."

run_scan "vulnerable-frontend" "$VULNERABLE_FRONTEND_URL"
run_scan "secure-frontend" "$SECURE_FRONTEND_URL"
run_scan "vulnerable-backend" "$VULNERABLE_API_URL"
run_scan "secure-backend" "$SECURE_API_URL"

echo
echo "======================================"
echo " All ZAP baseline scans completed."
echo " Reports saved in scanner/reports/"
echo "======================================"
