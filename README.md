# progress-log (a Claude Code skill)

![The progress log — timestamped entries, status pills, branch badges, embedded media, and a live-preview toggle](assets/hero.png)

A reusable system that gives any repo a **persistent, user-facing progress log** — a
self-contained `progress/index.html` that records every feature and build-out (newest
first, status pills, condense + per-post delete, relative times), plus an **Architecture**
tab that stays current. Optional one-tap live preview over a Cloudflare tunnel for viewing
on your phone.

## Where it lives
A skill is just a folder Claude Code auto-discovers under `~/.claude/skills/`. This one is
`~/.claude/skills/progress-log/`. Nothing is hosted on a server — it's local files.

## Install into a repo
```bash
bash ~/.claude/skills/progress-log/scripts/install.sh --mode rule
#   rule   = scaffold + always-on rule in the repo's CLAUDE.md   (recommended)
#   hook   = rule + a Stop hook that blocks finishing if code changed but the log didn't
#   manual = scaffold only (invoke the skill by hand)
```
Idempotent — never clobbers existing entries; refreshes the engine + scripts.

## Use it
- Slash commands: **`/progress`** or **`/changelog`** (then describe what changed).
- Or just ask: "update the progress log."
- The full method agents follow is the scaffolded `progress/README.md`.

## Live preview (opt-in)
Default is local-only. Flip `progress/preview.json` `"tunnel": true` (or tick the checkbox
at the bottom of the hosted page) and an agent will run `scripts/progress-tunnel.sh` and
hand you a tappable link.

## Share it
It's a folder — copy it.
- **Zip:** `zip -r progress-log.zip ~/.claude/skills/progress-log` → recipient unzips into
  their `~/.claude/skills/`.
- **Git:** push it to a repo; recipient clones into `~/.claude/skills/progress-log`.

## What's inside
- `SKILL.md` — the method + install/usage Claude loads.
- `templates/` — `index.html` (the log engine), `architecture.html` + `architectures.data.js`
  (the Architecture tab), `about.html` (in-page guide), `README.md` (the protocol),
  `preview.json`, `claude-block.md` (the injected rule).
- `scripts/` — `install.sh`, `progress-server.py` (serves + accepts the checkbox write),
  `progress-tunnel.sh`, `progress-shot.mjs` (real-viewport screenshots), `progress-standalone.mjs`.
