# progress-log — Traces (a Claude Code skill)

![Traces — a GitHub-repo-style progress log: top bar with logo, a left table-of-contents that ticks through 8 items as you scroll, a centered feed of collapsible entries grouped by day, and a right rail of quick actions](assets/hero.png)

**Traces** is a reusable system that gives any repo a **persistent, user-facing progress
log** — a self-contained `progress/index.html` laid out like a GitHub repo page:

- a **top bar** with the Traces wordmark + your repo name;
- a **left table-of-contents** that shows 8 items at a time and *ticks* (animates) to keep
  the current entry centered as you scroll (sliding marker, click to jump);
- a **centered feed** of every feature and build-out — newest first, **grouped by day**
  (Today, Yesterday, …) with **collapsible details** (each entry tucks its bullets, media,
  and branch behind a *Show details* toggle; recent work opens by default);
- a **right rail** of quick actions (an **All assets** grid, Architecture, Readme) and an
  About blurb.

Plus an **Architecture** tab that stays current, status pills, condense + per-post delete,
relative times, and optional one-tap live preview over a Cloudflare tunnel.

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
