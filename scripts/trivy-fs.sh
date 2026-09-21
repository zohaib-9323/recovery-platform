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

# Trivy pulls its vulnerability DB from an OCI registry (mirror.gcr.io) using
# go-containerregistry, which reads the developer's real ~/.docker/config.json
# for registry auth. On machines where Docker Desktop was removed (or never
# installed) but an old "credsStore": "desktop" entry is still on disk, that
# lookup shells out to a `docker-credential-desktop` binary that no longer
# exists, and the DB download hard-fails before any scanning happens — even
# though no registry auth is actually needed to pull the public trivy-db
# artifact. Point DOCKER_CONFIG at an isolated, empty config for this
# invocation only so Trivy's OCI pull never touches the host's Docker
# credential helpers.
TRIVY_DOCKER_CONFIG_DIR="$(mktemp -d)"
trap 'rm -rf "$TRIVY_DOCKER_CONFIG_DIR"' EXIT
echo '{}' > "$TRIVY_DOCKER_CONFIG_DIR/config.json"
export DOCKER_CONFIG="$TRIVY_DOCKER_CONFIG_DIR"

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
elif [ -x "$ROOT/bin/trivy" ]; then
  run_trivy "$ROOT/bin/trivy"
elif command -v docker >/dev/null 2>&1; then
  run_trivy docker run --rm -v "$ROOT:/repo" -w /repo aquasec/trivy:latest
else
  echo "trivy-fs: ensuring local Trivy binary..."
  node "$ROOT/scripts/ensure-trivy.mjs"
  run_trivy "$ROOT/bin/trivy"
fi
