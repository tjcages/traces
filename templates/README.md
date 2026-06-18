# Progress Log — agent protocol

`progress/index.html` is the **persistent journal** of agent work on this repo. The user
follows along here, so keep it current, honest, and visual. These rules are **strict**:
the whole point is that the user can glance at the log and instantly see *what actually
changed* — without wading through duplicate, half-finished, or stale entries.

## The golden rule: one entry per TASK, not per commit

An **entry is a unit of work** (a feature, a fix, a design pass), *not* a commit or a
micro-step. This is the single most important rule — it's what keeps the log readable.

- **New task** → prepend a **new** `<article class="entry">` right after the
  `<!-- ENTRIES:START -->` marker (newest on top).
- **Same task continuing** (follow-ups, the user's tweaks, more sub-parts, a fix to what
  you just shipped) → **EDIT your existing entry in place.** Do **not** append a near-
  duplicate. Refine the bullets, bump the status, swap in a fresher screenshot.

> If you're about to write a second entry that starts with the same feature name as one
> you wrote in the last hour, stop — you almost certainly mean to *edit the first one*.

The high-level entry is a **short summary: what happened + what's the output.** (Deeper,
per-task detail pages — "telescope" views with the full play-by-play — are coming later;
that's where granular notes will live. Keep the entry itself a glanceable summary.)

## When you MUST log (applicable = almost always)

Log whenever you: ship anything **user-visible or behavioral**, add/remove a feature, fix
a real bug, do a design pass, or make a **direction-changing decision**. The only things
you skip are pure-internal no-ops with no observable effect. When unsure, log it.

## Status lifecycle (edit it in place)

`data-status` on `.status`: **`wip` → amber**, **`new` → blue**, **`done` → green**,
**`failed` → red**. Open an entry as `wip` the moment you start; flip the *same* entry to
`new` or `done` when it lands and you've checked it. **Never** open a second entry just to
announce "now done."

- **`new` = `done` + "look at this now."** Use it for a landed change you want the user to
  notice promptly — it outranks plain `done`, which is the quiet baseline for settled work.
- **`new` is temporary — it ages back to `done`.** The page auto-demotes a `new` that's been
  untouched for ~2h (uses the `edited` time if present, else the created time). On top of
  that, **demote stale `new`s yourself** when you start a session or move on to different
  work — be a little aggressive. Aim for **~one `new` at a time**; not everything needs it.
  (Editing the entry refreshes its clock, so active work stays `new`.)

## Keep it current-state, not a diary

When you edit an entry as the work evolves, the bullets describe **what the change *is*
now** — prune steps that were superseded. Added X then reworked it? The bullet describes
the final X. The reader should see *what changed*, not *how you got there*.

## How to fill an entry

- `<time datetime="…">` — ISO-8601 UTC (e.g. `2026-06-13T00:15:00Z`); JS renders it as a
  relative label ("2 hours ago"). This is **when the work started** — never change it once
  set. (The text inside is a no-JS fallback.)
- `<span class="edited" data-time="…">` — **add this when you edit an entry after creating
  it.** It renders "updated 3 min ago" next to the time, so the user can spot what's moving.
  Refresh its `data-time` to the current UTC each time you make a meaningful edit.
- `<a class="branch">` — your branch **name** as text; JS links it to GitHub.
- `<h2>` title (≤5 words) + `<div class="entry-body">` bullets (≤12 words each, bullets
  only, no prose). **Scannable in two seconds.**

## Screenshots & media (for any visual change)

Save files into `progress/media/` and reference them by relative path inside
`<div class="media">` (`<figure><img …><figcaption></figure>`). Media goes **between the
title and the bullets** (reading order: title → image → bullets). For UI work a screenshot
is **expected, not optional**.

**One image per task — overwrite, don't accumulate.** As you iterate within a task/session,
**replace the same file in place** (re-capture over the existing path) so the entry always
shows the *most recent* state. Don't litter `media/` with `foo-v1`, `foo-v2`, near-identical
tweaks — keep one current image per task. (Different tasks get their own image.) Drop the
`<figure>` entirely if there's no media.

Capture at a real viewport with the helper (plain headless `--window-size` does **not** set
the layout viewport — mobile shots come out clipped):

```bash
# serve progress/ (the `progress` entry in .claude/launch.json), then:
node scripts/progress-shot.mjs http://localhost:8901/index.html \
  progress/media/<name>.png 375 760 mobile     # or: 760 430 desktop
```

## Ownership (parallel agents)

You may edit **your own** (same-branch) **active** entries freely. **Don't** edit another
agent's entry, or an older **settled** entry (one that's `done` and that you've moved on
from), except to fix a plain factual error or while resolving a merge. Settled + not-yours
= append-only.

## The architecture canvas (`architecture.html` — the Architecture tab)

A navigable React Flow canvas of the app, one tab per buildout (mirrors the
cloudflare admin's /architectures pattern). **Renderer and data are split on
purpose** — this is the seed of a take-any-repo skill:

- `architecture.html` — the repo-agnostic renderer (React 18 + @xyflow/react 12
  via esm.sh, no build step). Don't put repo content here. **Layout is
  computed**: buildouts declare ordered `groups` (lanes); the renderer lays
  them on a fixed grid — uniform node size/spacing, equal-height lanes,
  vertically centered columns, no overlap — with single converging entry/exit
  points per node side (forward = right→left-in, back-edge = left→right-in,
  same-lane = bottom→top-in).
- `architectures.data.js` — ALL the content: buildouts of `groups[].nodes[]`
  with `kind` (surface / engine / store / inlet / external / job), file `refs`,
  and `targets` arrays that auto-generate the edges. NO positions in data.
- To keep it current: edit the data file when the architecture moves. To map a
  DIFFERENT repo: emit a new data file, reuse the renderer unchanged.
- Preview: `python3 -m http.server -d progress` (or the `progress` entry in
  `.claude/launch.json`) — esm.sh modules need network.

## The tech-stack page (`stack.html` — the Tech stack tab)

A plain-English "what is this repo built on" reference, styled exactly like the
Readme page (`about.html`): a GitHub-style **language bar** on top, then
expandable cards grouped by area (languages, framework & runtime, data, infra,
UI, auth, AI, tests, tooling…). Each card lists its deps as
`name · plain-English one-liner · version` rows.

On first install it's a **placeholder — fill it from the repo:**

- Read the manifests — `package.json`, `go.mod`, `Cargo.toml`, `Package.swift`,
  `requirements.txt`/`pyproject.toml`, `Gemfile`, `*.csproj`, plus the infra
  config (e.g. `wrangler.jsonc`, `Dockerfile`, CI). One card per area; write each
  description for a **non-expert** — what it does, not jargon.
- Compute the `.langbar` segment widths + legend percentages from each language's
  **byte share**, e.g. `find <dir> -name '*.ext' | xargs cat | wc -c`.

**Keep it current** when the stack actually moves: a framework/library/tool
added or removed → add/remove its `.dep` row (or a card); a **major** version
bump → update the `.ver` pill (patch/minor don't matter); a real language-mix
shift → refresh the bar; a new infra binding → add it. Source-only (no JS/build)
— reuse the existing classes (`.langbar`, `.dep`, `.card`…), no new styles.

## Hard rules

- **One entry per task; edit-in-place for the same task.** New entries go at the top
  (newest first). Edit **your own active** entry as that work evolves (mark it with the
  `edited` span); don't append near-duplicates. Other agents' and older settled entries are
  append-only — never reorder or delete them.
- **Keep the markers** (`ENTRIES:START` / `ENTRIES:END`) and the `entry-skeleton` template intact.
- **Keep `stack.html` current** when the stack moves (a dep/tool/binding added or removed, a major version bump, a real language-mix shift). See "The tech-stack page" above.
- **Commit AND push after every update** (to `main`, or land your worktree) so the change
  reaches origin and the user can pull and actually see it. Never leave updates sitting only
  in your working tree — if it isn't pushed, the user can't see it.
- Times are **UTC**. Styling follows the house design system (iOS/macOS) — reuse the
  existing classes (`.entry`, `.entry-head`, `.status`, `.media`…); don't introduce new
  styles. Primary cards are white & borderless; secondary surfaces are grey & borderless.
- The masthead's **Newest first ↑** control toggles render order; source order stays
  newest-first, so always prepend at the top regardless.

## Live preview (Cloudflare tunnel) — OPT-IN

By **default the agent just edits the local `progress/` files** — no tunnel, no link. That's
all you need at your desk (open `progress/index.html` directly).

Live preview is for when you're **on your phone / away** and want a tappable link. It's
gated by `progress/preview.json`:

- `"tunnel": false` (default) → local only.
- `"tunnel": true` (or you ask "turn live preview on") → the agent runs the tunnel and posts
  a clickable **Open Traces** link.

```bash
bash scripts/progress-tunnel.sh     # → prints https://<random>.trycloudflare.com
                                    #   (also written to /tmp/progress-tunnel-url.txt)
```

That URL always shows the current `progress/index.html`, served live off disk. **When live
preview is on, make sure the tunnel is up and put the link at the BOTTOM of your reply as a
clickable markdown hyperlink — exactly `[Open Traces](URL)`, NEVER a bare/pasted
URL and no emoji.** Read `URL` **fresh** from `/tmp/progress-tunnel-url.txt` every time — it
changes whenever the tunnel restarts, so never reuse a URL you remember. (A one-tap in-page
toggle would need a tiny backend — the page is static — so the flag + agent is the control.)

**Network egress:** the tunnel needs the environment's egress policy to allow
`api.trycloudflare.com` and `*.argotunnel.com:7844`. If it's blocked you'll see
`Host not in allowlist` — the env owner must widen egress (see
https://code.claude.com/docs/en/claude-code-on-the-web). The quick-tunnel URL is fresh per
container; for a stable hostname use a named tunnel tied to a Cloudflare account.

Fallback (no network): `node scripts/progress-standalone.mjs` builds a single self-contained
`/tmp/Socials-Progress.html` (media inlined) you can hand to the user directly.

## Worktrees / parallel agents

All worktrees share this one log. Prepend your entry, tag it with your branch, and land
it like any other change (`bash scripts/worktree.sh land <branch>`). If two agents add
entries at once, resolve the merge by keeping **both** `<article>` blocks (newest by
timestamp on top) — never drop one.
