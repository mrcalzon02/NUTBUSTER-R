#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
command -v go >/dev/null || { echo "Go compiler is required to build launchers." >&2; exit 1; }
# Assets are embedded in the binary, not stored in an external folder.
rm -rf launcher/web
trap 'rm -rf "$ROOT/launcher/web"' EXIT
cp -a web launcher/web
mkdir -p release
export CGO_ENABLED=0
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags='-s -w' -o release/NUTBUSTER-Windows-x64.exe ./launcher
GOOS=linux GOARCH=amd64 go build -trimpath -ldflags='-s -w' -o release/NUTBUSTER-Linux-x64 ./launcher
chmod +x release/NUTBUSTER-Linux-x64
file release/NUTBUSTER-*
sha256sum release/NUTBUSTER-*
