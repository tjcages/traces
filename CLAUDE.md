# traces — agent instructions

A Claude Code skill that gives any repo a self-contained, user-facing progress log (`progress/index.html`) plus living Architecture and Tech-stack tabs. This repo is the skill's canonical home (symlinked into `~/.claude/skills/traces`). The [README](./README.md) (vision) + [SKILL.md](./SKILL.md) (the method) are the North Star — read them before structural changes.

## Linear tracking (non-negotiable)

Every agent, every session. Linear workspace: **team "Off-brand"**, **project "traces"**. Structure already in place: milestones `v0.1.0 — First versioned cut` (done) / `Distribution readiness` (active) / `Launch: rollout`; issue labels `engine` / `tabs` / `installer` / `method` (under the `traces` label group); project label `Tool`. The tracking goal is **distribute/publish the skill** — the gating open decision is the distribution channel (OFF-76).

- **Search before creating.** Check for an existing issue match before filing anything new — never create a duplicate for work already tracked. Found a stale/duplicate issue? Mark it `Duplicate`, don't ignore it.
- **Non-trivial work gets an issue.** A real feature, fix, decision, or roadmap item gets a Linear issue in **traces**, filed as soon as the work is identified — before or at the start of work, not after. Trivial edits don't need one.
- **Every issue gets a milestone.** `Distribution readiness` for pre-release engineering/QA/docs/assets, `Launch: rollout` for announcement beats. An issue with no milestone is mis-filed.
- **Lifecycle is real, not decorative.** `Backlog` → `In Progress` the moment work starts → `Done` only once actually shipped (merged to `main`, verified working). Never jump straight to `Done`; never leave active work sitting in `Backlog`. Session ending before something's finished? Leave it `In Progress` with a comment on what's left.
- **Label by module:** `engine` (templates/index.html — feed/TOC/cards/pills), `tabs` (architecture.html + stack.html), `installer` (install.sh + scripts/), `method` (SKILL.md + templates/README.md + claude-block.md). Repo-wide work (packaging, releases) goes unlabeled.
- **Keep CHANGELOG.md and Linear in agreement.** Releases get a CHANGELOG entry AND their issues closed; a claim in the CHANGELOG that reality doesn't back (see OFF-78) is a bug to fix, not a footnote.
- **Wire real dependencies** (`blockedBy`/`blocks`) for genuine sequencing — e.g. the announcement is blocked by the channel decision + QA + assets.
- **Close the loop before ending a session.** If tracked work happened, update the issue (state and/or a short comment) before finishing. Shipping something but leaving Linear stale is not done.
- **Status updates at real milestones only.** Post a project status update when a milestone completes or health materially changes — not for routine incremental work.
- **Use Linear's generated branch names** (`ty/off-N-slug`) so commits/PRs auto-link — never hand-roll a parallel scheme.
