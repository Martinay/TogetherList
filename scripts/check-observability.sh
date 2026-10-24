#!/usr/bin/env bash
set -euo pipefail
: "${TMPDIR:?TMPDIR must be set for generated artifacts}"
root=$(cd "$(dirname "$0")/.." && pwd)
check_dir=$(mktemp -d "$TMPDIR/togetherlist-collector.XXXXXX")
trap 'rm -rf "$check_dir"' EXIT
version=0.147.0
release="https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${version}"
archive="otelcol-contrib_${version}_linux_amd64.tar.gz"
curl -fsSL "$release/$archive" -o "$check_dir/$archive"
curl -fsSL "$release/opentelemetry-collector-releases_otelcol-contrib_checksums.txt" -o "$check_dir/checksums.txt"
(cd "$check_dir" && sha256sum --check --strict --ignore-missing checksums.txt)
tar -xzf "$check_dir/$archive" -C "$check_dir" otelcol-contrib
cd "$root"
python3 scripts/test-observability-pipeline.py "$check_dir/otelcol-contrib"
