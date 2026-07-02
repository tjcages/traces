# Changelog

All notable changes to the Traces skill. Format: [Keep a Changelog](https://keepachangelog.com/),
loosely — this repo dogfoods itself, so the human-facing log of the *tool's own* build-out also
lives in its `progress/` log; this file is the release-tagged summary.

## [Unreleased]
- Extracted to a standalone repo at `~/Workspace/traces` (symlinked into `~/.claude/skills/`).

## [0.1.0] — 2026-07-02
First versioned cut. The engine and installer as they stand today.

### Engine (`templates/index.html`)
- GitHub-repo-style layout: top bar + wordmark, left ticking table-of-contents,
  centered day-grouped feed, right rail (All assets / Architecture / Readme).
- Collapsible entries; recent work opens by default. Status pills with auto-aging
  (`wip → new → done`, `new` demotes after ~2h). Condense tray + per-post delete.
- Minimized (collapsed) card thumbnail: right-aligned preview, constant card height,
  70/30 bottom clip at the card edge, portrait images auto-narrowed, full mobile stack.
- New gradient-fade wordmark; full mobile/iOS layout; justified All-assets gallery.

### Architecture tab
- Repo-agnostic React-Flow renderer (`templates/architecture.html`) + seed data
  (`architectures.data.js`).

### Tech-stack tab
- `templates/stack.html` — GitHub-style language bar + per-area cards; seeded as a
  fill-in placeholder the agent completes from the repo's manifests.

### Installer & scripts
- `scripts/install.sh` — idempotent scaffold with `rule` / `hook` / `manual` modes;
  never clobbers existing entries.
- `progress-server.py`, `progress-tunnel.sh` (opt-in Cloudflare live preview),
  `progress-shot.mjs` (real-viewport screenshots), `progress-standalone.mjs`.
