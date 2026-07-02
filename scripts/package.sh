#!/usr/bin/env bash
# package.sh — build a distributable Traces skill bundle.
#
#   bash scripts/package.sh
#
# Produces dist/traces-v<VERSION>.skill (a zip staged under a top-level traces/
# dir, the layout Claude Code / claude.ai expect). Excludes git, dist, media,
# and OS cruft. Version comes from the VERSION file.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
VERSION="$(tr -d ' \n' < VERSION)"
OUT="dist/traces-v${VERSION}.skill"

rm -rf dist && mkdir -p dist/stage/traces
# copy only the skill payload (not repo meta / build output)
cp -R SKILL.md README.md CHANGELOG.md VERSION LICENSE scripts templates assets dist/stage/traces/ 2>/dev/null || true
# drop the packager itself and any cruft from the bundle
rm -f dist/stage/traces/scripts/package.sh
find dist/stage -name '.DS_Store' -delete 2>/dev/null || true

( cd dist/stage && zip -qr "../traces-v${VERSION}.skill" traces )
rm -rf dist/stage

echo "✓ built $OUT"
unzip -l "$OUT" | tail -n +2 | head -30
