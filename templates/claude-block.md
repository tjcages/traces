<!-- PROGRESS-LOG:START (managed by the Traces skill; edit between these markers) -->
## Progress log — non-negotiable (every agent, every session)

Keep **`progress/index.html`** current as you work — it's the user-facing log of what
changed. Protocol: **`progress/README.md`** (read it once).

- **One entry per TASK, not per commit.** New task → prepend a new `<article class="entry">`
  right after the `ENTRIES:START` marker (newest on top), copied from the `entry-skeleton`
  template. **Same task continuing → EDIT your existing entry in place** (refine bullets,
  advance status, swap a fresher screenshot, add `<span class="edited" data-time="ISO">` so
  it shows "updated …") — never append a near-duplicate. Bullets are **current-state, not a
  diary** (≤5-word header, bullets ≤12 words, no prose).
- **Status** (`data-status`): `wip` (amber) → `new` (blue) | `done` (green) | `failed` (red).
  `new` = "done + look at this now"; it auto-ages to `done` after ~2h, and you should demote
  stale `new`s yourself when you start / move on (≈one `new` at a time).
- **Maintain the Architecture tab.** When the system's shape changes, update
  `progress/architectures.data.js` (the one living map) — add/rename/retire nodes + edges.
- **Maintain the Tech-stack tab.** When the stack moves (a framework/library/tool/binding
  added or removed, a major version bump, a real language-mix shift), update
  `progress/stack.html` — keep it a plain-English, current picture of what the repo runs on.
- **One image per task**: overwrite the SAME media file as you iterate this session (capture
  at a real viewport with `node scripts/progress-shot.mjs`); don't pile up variants.
- **Only edit your own** (same-branch) active entries; others' and older settled entries are
  append-only. **Commit AND push every update.**
- **Live preview is OPT-IN:** only when `progress/preview.json` has `"tunnel": true` (or the
  user asks) do you run `scripts/progress-tunnel.sh` and put a link at the BOTTOM of your
  reply; otherwise just edit the local files — no link. **The link MUST be a clickable
  markdown hyperlink, exactly `[Open Traces](URL)` — NEVER a bare/pasted URL and
  no emoji.** Read `URL` **fresh** from `/tmp/progress-tunnel-url.txt` each time (it changes
  when the tunnel restarts — never reuse a remembered one).
<!-- PROGRESS-LOG:END -->
