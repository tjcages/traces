---
name: progress-log
description: >-
  Install and maintain a self-contained, user-facing PROGRESS LOG for a repo
  (progress/index.html — timestamped entries, status pills, condense + per-post
  delete, optional Cloudflare-tunnel live preview) plus a living Architecture
  tab. Use whenever: scaffolding a progress log / project changelog page; the
  user types /progress or /changelog; you finish or ship a feature, fix, or
  notable change in a repo that has (or should have) a progress/ log — record it
  even if not explicitly asked; updating, editing, or condensing log entries;
  maintaining the architecture map; choosing enforcement (rule / hook / manual);
  or toggling the live-preview link. Bias toward any "log/record what changed",
  "update the changelog", or "set up a changelog" request about the project's own
  progress — but NOT for reading a dependency's external CHANGELOG.md.
---

# Progress log

A persistent, self-contained **`progress/index.html`** that tracks every feature and
build-out in a repo — newest first, scannable in two seconds, viewable on a phone via an
optional Cloudflare tunnel. It is the user's window into "what actually changed." A second
tab, **Architecture**, is a living map of the system. No build step, no dependencies.

## Installing it into a repo

Run the installer from (or pointing at) the target repo. Pick an **enforcement mode**:

```bash
bash ~/.claude/skills/progress-log/scripts/install.sh --mode rule    # default
#                                                      --mode hook    # + forcing Stop hook
#                                                      --mode manual  # scaffold only
```

- **`rule`** (recommended default) — scaffolds `progress/` + `scripts/` and writes an
  always-on non-negotiable into the repo's `CLAUDE.md` (between `PROGRESS-LOG` markers). This
  is what makes "every agent, every session" real — `CLAUDE.md` is always in context, whereas
  a skill only loads on demand.
- **`hook`** — everything in `rule`, plus a `Stop` hook (`.claude/hooks/progress-log-reminder.sh`)
  that blocks stopping if you changed code but didn't touch `progress/`. The forcing function;
  nothing slips. Registered in `.claude/settings.json` (needs `jq`, else prints the snippet).
- **`manual`** — scaffold only, no `CLAUDE.md` rule. You invoke this skill by hand when you
  want to log something. (Manual invocation works in every mode.)

Idempotent: re-running never clobbers an existing `progress/index.html` (entries preserved);
it refreshes the renderer + scripts and updates the `CLAUDE.md` block in place.

## The method (what agents must do)

Full rules live in the scaffolded **`progress/README.md`** — read it. The essentials:

- **One entry per TASK, not per commit.** New task → prepend a new `<article class="entry">`
  after `ENTRIES:START` (newest on top). **Same task continuing → EDIT that entry in place**
  (bullets, status, screenshot, `<span class="edited" data-time="ISO">`); never append a
  near-duplicate. Bullets are **current-state, not a diary** — ≤5-word header, ≤12-word bullets.
- **Status** (`data-status`): `wip` (amber) → `new` (blue) | `done` (green) | `failed` (red).
  `new` = "done + look now"; it auto-ages to `done` (~2h) and you demote stale ones (≈one at a time).
- **Maintain the Architecture tab** — edit `progress/architectures.data.js` when the system's
  shape changes (it's repo-agnostic data; the renderer is reused unchanged).
- **One image per task** — overwrite the same media file as you iterate; capture at a real
  viewport: `node scripts/progress-shot.mjs <url> progress/media/<name>.png 375 760 mobile`
  (or `760 430 desktop`). Live server: `python3 -m http.server -d progress`.
- **Commit AND push every update.** Only edit your own active entries.

## Live preview (opt-in)

Default is local-only — just edit the files. Flip `progress/preview.json` `"tunnel": true`
(or tick the page's footer toggle, or the user asks) and the agent runs
`scripts/progress-tunnel.sh`, then posts the link at the bottom of the reply. The link **must
be a clickable markdown hyperlink, exactly `[Open the progress log →](URL)`** — never a bare
URL, no emoji — and `URL` is read **fresh** from `/tmp/progress-tunnel-url.txt` every time (it
changes when the tunnel restarts).

## Files this skill carries

- `templates/` — `index.html` (the log engine: relative times, branch→GitHub badges,
  condense tray, per-post delete, status aging, live-preview toggle), `architecture.html`
  (repo-agnostic React-Flow renderer) + `architectures.data.js` (seed), `about.html` (the
  in-page readme), `README.md` (full protocol), `preview.json`, `claude-block.md` (the
  injected rule).
- `scripts/` — `install.sh`, `progress-server.py` (serves + accepts the toggle's write),
  `progress-tunnel.sh`, `progress-shot.mjs` (real-viewport screenshots), `progress-standalone.mjs`.
