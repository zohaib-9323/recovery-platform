#!/usr/bin/env sh
# Dependency vulnerability scan (package-lock.json). Fails on CRITICAL CVEs.
# SKIP_TRIVY=1 — no-op (useful in environments without Trivy binary).
set -e
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "${SKIP_TRIVY:-}" = "1" ] || [ "${SKIP_TRIVY:-}" = "true" ]; then
  echo "trivy-fs: SKIP_TRIVY set — skipping scan (run Trivy locally or in CI)."
  exit 0
fi

run_trivy() {
  "$@" fs \
    --scanners vuln \
    --severity CRITICAL \
    --exit-code 1 \
    --skip-dirs node_modules,build,dist,coverage,.git \
    .
}

if command -v trivy >/dev/null 2>&1; then
  run_trivy trivy
elif command -v docker >/dev/null 2>&1; then
  run_trivy docker run --rm -v "$ROOT:/repo" -w /repo aquasec/trivy:latest
else
  echo "trivy-fs: install Trivy (https://trivy.dev/latest/getting-started/installation/) or Docker."
  exit 1
fi
