#!/usr/bin/env bash
# install.sh — scaffold the Traces progress-log system into a repo.
#
#   bash install.sh [--root <repo>] [--mode rule|hook|manual]
#
#   rule   (default) scaffold + inject the always-on CLAUDE.md non-negotiable.
#   hook             rule + a Stop hook that blocks stopping if you changed code
#                    but didn't touch progress/ (the forcing function).
#   manual           scaffold only; no CLAUDE.md rule (invoke the skill by hand).
#
# Idempotent: never clobbers an existing progress/index.html (preserves entries);
# refreshes the renderer/scripts; updates the CLAUDE block between its markers.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT=""; MODE="rule"
while [ $# -gt 0 ]; do case "$1" in
  --root) ROOT="$2"; shift 2;;
  --mode) MODE="$2"; shift 2;;
  *) echo "unknown arg: $1" >&2; exit 1;;
esac; done
[ -n "$ROOT" ] || ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

mkdir -p "$ROOT/progress/media" "$ROOT/scripts"

# --- scripts (always refresh) ---
cp "$SKILL_DIR/scripts/progress-tunnel.sh" "$ROOT/scripts/" 2>/dev/null || true
cp "$SKILL_DIR/scripts/progress-server.py" "$ROOT/scripts/" 2>/dev/null || true
cp "$SKILL_DIR/scripts/progress-shot.mjs" "$ROOT/scripts/" 2>/dev/null || true
cp "$SKILL_DIR/scripts/progress-standalone.mjs" "$ROOT/scripts/" 2>/dev/null || true
chmod +x "$ROOT/scripts/progress-tunnel.sh" 2>/dev/null || true

# --- static assets: renderer + about + protocol always refresh; preview.json if absent ---
cp "$SKILL_DIR/templates/architecture.html" "$ROOT/progress/"
cp "$SKILL_DIR/templates/about.html" "$ROOT/progress/"
cp "$SKILL_DIR/templates/README.md" "$ROOT/progress/"
[ -f "$ROOT/progress/preview.json" ]          || cp "$SKILL_DIR/templates/preview.json" "$ROOT/progress/"
[ -f "$ROOT/progress/architectures.data.js" ] || cp "$SKILL_DIR/templates/architectures.data.js" "$ROOT/progress/"
# stack.html is repo-specific (deps differ per repo) → seed if absent; agent fills it in.
[ -f "$ROOT/progress/stack.html" ]            || cp "$SKILL_DIR/templates/stack.html" "$ROOT/progress/"

# --- index.html: only scaffold if missing (preserve real entries) ---
if [ ! -f "$ROOT/progress/index.html" ]; then
  REPO_URL="$(git -C "$ROOT" remote get-url origin 2>/dev/null | head -1 || true)"
  REPO_URL="$(printf '%s' "$REPO_URL" | sed -E 's#^git@github\.com:#https://github.com/#; s#\.git$##' | tr -d '\n')"
  PROJECT="$(basename "$ROOT" | tr -d '\n')"
  BRANCH="$(git -C "$ROOT" branch --show-current 2>/dev/null | head -1)"; [ -n "$BRANCH" ] || BRANCH="main"
  ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; LABEL="$(date -u +'%Y-%m-%d · %H:%M UTC')"
  sed -e "s#__REPO_URL__#${REPO_URL}#g" -e "s#__PROJECT__#${PROJECT}#g" \
      -e "s#__BRANCH__#${BRANCH}#g" -e "s#__SEED_ISO__#${ISO}#g" -e "s#__SEED_LABEL__#${LABEL}#g" \
      "$SKILL_DIR/templates/index.html" > "$ROOT/progress/index.html"
  # propagate REPO/PROJECT into the architecture renderer + tech-stack page too
  sed -i.bak -e "s#__PROJECT__#${PROJECT}#g" "$ROOT/progress/architecture.html" "$ROOT/progress/stack.html" && rm -f "$ROOT/progress/architecture.html.bak" "$ROOT/progress/stack.html.bak"
  echo "scaffolded progress/index.html (project=$PROJECT, repo=$REPO_URL)"
else
  sed -i.bak -e "s#__PROJECT__#$(basename "$ROOT")#g" "$ROOT/progress/architecture.html" "$ROOT/progress/stack.html" && rm -f "$ROOT/progress/architecture.html.bak" "$ROOT/progress/stack.html.bak"
  echo "kept existing progress/index.html (entries preserved)"
fi

# --- enforcement ---
inject_claude() {
  local cm="$ROOT/CLAUDE.md"; local block; block="$(cat "$SKILL_DIR/templates/claude-block.md")"
  touch "$cm"
  if grep -q 'PROGRESS-LOG:START' "$cm"; then
    perl -0pi -e 'BEGIN{local $/; open(F,"<",$ENV{BLOCK_FILE}); $b=<F>} s/<!-- PROGRESS-LOG:START.*?PROGRESS-LOG:END -->/$b/s' "$cm"
    echo "updated CLAUDE.md progress-log block"
  else
    printf '\n%s\n' "$block" >> "$cm"; echo "appended progress-log block to CLAUDE.md"
  fi
}

case "$MODE" in
  manual) echo "mode=manual — no CLAUDE.md rule; invoke the skill by hand.";;
  rule)   BLOCK_FILE="$SKILL_DIR/templates/claude-block.md" inject_claude;;
  hook)
    BLOCK_FILE="$SKILL_DIR/templates/claude-block.md" inject_claude
    mkdir -p "$ROOT/.claude/hooks"
    cat > "$ROOT/.claude/hooks/progress-log-reminder.sh" <<'HOOK'
#!/usr/bin/env bash
# Stop hook: block stopping if code/UI changed but progress/ was not touched.
root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
changed="$(git -C "$root" status --porcelain 2>/dev/null)"
[ -n "$changed" ] || exit 0
echo "$changed" | grep -q '^.\{1,\} *progress/' && exit 0   # progress/ touched → ok
if echo "$changed" | grep -qvE ' (\.claude/|$)'; then
  echo "You changed files but did not update the progress log. Add/edit progress/index.html (see progress/README.md) before stopping." >&2
  exit 2
fi
exit 0
HOOK
    chmod +x "$ROOT/.claude/hooks/progress-log-reminder.sh"
    SETTINGS="$ROOT/.claude/settings.json"
    if command -v jq >/dev/null 2>&1; then
      [ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"
      tmp="$(mktemp)"
      jq '.hooks.Stop = ((.hooks.Stop // []) + [{"hooks":[{"type":"command","command":".claude/hooks/progress-log-reminder.sh"}]}])' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
      echo "registered Stop hook in .claude/settings.json"
    else
      echo "jq not found — add this to .claude/settings.json manually:"
      echo '  {"hooks":{"Stop":[{"hooks":[{"type":"command","command":".claude/hooks/progress-log-reminder.sh"}]}]}}'
    fi;;
  *) echo "unknown mode: $MODE" >&2; exit 1;;
esac

echo "✓ Traces installed in $ROOT (mode=$MODE). Open progress/index.html."
