#!/usr/bin/env bash
# package.sh — build a distributable Traces skill bundle.
#
#   bash skills/traces/scripts/package.sh
#
# Produces dist/traces-v<VERSION>.skill (a zip staged under a top-level traces/
# dir with SKILL.md at its root — the layout claude.ai's Skills uploader and
# `npx skills add` expect). Excludes git, dist, media, and OS cruft.
set -euo pipefail

SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # skills/traces
REPO_ROOT="$(cd "$SKILL_ROOT/../.." && pwd)"                    # repo root
cd "$REPO_ROOT"
VERSION="$(tr -d ' \n' < VERSION)"
OUT="dist/traces-v${VERSION}.skill"

rm -rf dist && mkdir -p dist/stage/traces
# the skill payload
cp -R skills/traces/SKILL.md skills/traces/scripts skills/traces/templates skills/traces/assets dist/stage/traces/
# repo-level docs for context inside the bundle
cp LICENSE README.md CHANGELOG.md VERSION dist/stage/traces/ 2>/dev/null || true
# drop the packager itself and any cruft from the bundle
rm -f dist/stage/traces/scripts/package.sh
find dist/stage -name '.DS_Store' -delete 2>/dev/null || true

( cd dist/stage && zip -qr "../traces-v${VERSION}.skill" traces )
rm -rf dist/stage

echo "✓ built $OUT"
unzip -l "$OUT" | tail -n +2 | head -40
