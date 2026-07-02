#!/usr/bin/env node
// sync-engine.mjs — move the Traces *engine* between the template and a live
// install, WITHOUT touching that install's data (its entries + About blurb).
//
//   node scripts/sync-engine.mjs push <repo>   templates/index.html  → <repo>/progress/index.html
//   node scripts/sync-engine.mjs pull <repo>   <repo>/progress/index.html → templates/index.html
//   ...add --dry to preview (validate + summarize, write nothing).
//
// Why this exists: index.html is intentionally ONE self-contained file, so the
// engine (CSS/JS/chrome) and the data (entries, About text, repo identity) live
// fused together — and install.sh deliberately won't overwrite an existing
// index.html (it would wipe entries). So engine improvements couldn't flow
// either way without hand-splicing. This does the splice, safely:
//   • push  = ship an engine update INTO an install, preserving its entries/About.
//   • pull  = capture engine work done IN an install back into the template.
// Every write validates the result and leaves a <file>.bak backup first.
//
// Scope: index.html only (the hard one). The sibling engine pages
// (architecture.html, about.html) already refresh via `install.sh`.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = resolve(SKILL_DIR, "templates/index.html");

const E_START = "<!-- ENTRIES:START -->";
const E_END = "<!-- ENTRIES:END -->";
const ABOUT_RE = /(<p class="about-desc">)([\s\S]*?)(<\/p>)/;

// --- tiny helpers ---------------------------------------------------------
const die = (m) => { console.error(`✗ ${m}`); process.exit(1); };

function between(str, a, b) {
  const i = str.indexOf(a), j = str.indexOf(b);
  if (i < 0 || j < 0 || j < i) return null;
  return str.slice(i + a.length, j);
}
function replaceBetween(str, a, b, inner) {
  const i = str.indexOf(a), j = str.indexOf(b);
  return str.slice(0, i + a.length) + inner + str.slice(j);
}
function gitId(repo) {
  const g = (c) => { try { return execSync(`git -C "${repo}" ${c}`, { encoding: "utf8" }).trim(); } catch { return ""; } };
  const top = g("rev-parse --show-toplevel") || repo;
  let url = g("remote get-url origin").split("\n")[0] || "";
  url = url.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "");
  return { project: basename(top), repo: url, branch: g("branch --show-current") || "main" };
}
// count entries INSIDE the ENTRIES block only (ignore <article> examples that
// live in explanatory HTML comments elsewhere in the engine).
function countEntries(s) {
  const block = between(s, E_START, E_END) ?? "";
  return (block.match(/<article class="entry"/g) || []).length;
}
function tokensLeft(s) { return (s.match(/__(?:PROJECT|REPO_URL|BRANCH|SEED_ISO|SEED_LABEL)__/g) || []).length; }

// re-insert __TOKENS__ at the 6 identity anchors (value-agnostic) — used by pull.
function retokenize(s) {
  return s
    .replace(/<title>Traces \/ [^<]*<\/title>/, "<title>Traces / __PROJECT__</title>")
    .replace(/content="Traces \/ [^"]*"/g, 'content="Traces / __PROJECT__"')
    .replace(/<a class="repo" href="[^"]*">[^<]*<\/a>/, '<a class="repo" href="__REPO_URL__">__PROJECT__</a>')
    .replace(/(<a class="gh-link" href=)"[^"]*"/, '$1"__REPO_URL__"')
    .replace(/var REPO = "[^"]*";/, 'var REPO = "__REPO_URL__";');
}

// --- CLI ------------------------------------------------------------------
const [dir, repoArg, ...rest] = process.argv.slice(2);
const dry = rest.includes("--dry") || process.argv.includes("--dry");
if (!["push", "pull"].includes(dir) || !repoArg) {
  die("usage: sync-engine.mjs push|pull <repo> [--dry]");
}
const repo = resolve(repoArg);
const instanceFile = resolve(repo, "progress/index.html");
if (!existsSync(TEMPLATE)) die(`template not found: ${TEMPLATE}`);
if (!existsSync(instanceFile)) die(`no install at: ${instanceFile}`);

const template = readFileSync(TEMPLATE, "utf8");
const instance = readFileSync(instanceFile, "utf8");

for (const [name, s] of [["template", template], ["instance", instance]]) {
  if (!s.includes(E_START) || !s.includes(E_END)) die(`${name} is missing ENTRIES markers — not a Traces engine file`);
  if (!ABOUT_RE.test(s)) die(`${name} is missing the About blurb anchor`);
}

let target, out, result;

if (dir === "push") {
  // template engine → instance, keep instance's entries + About + identity
  const id = gitId(repo);
  const now = new Date();
  const iso = now.toISOString().replace(/\.\d+Z$/, "Z");
  const label = `${iso.slice(0, 10)} · ${iso.slice(11, 16)} UTC`;
  let s = template
    .replaceAll("__PROJECT__", id.project)
    .replaceAll("__REPO_URL__", id.repo)
    .replaceAll("__BRANCH__", id.branch)
    .replaceAll("__SEED_ISO__", iso)
    .replaceAll("__SEED_LABEL__", label);
  s = replaceBetween(s, E_START, E_END, between(instance, E_START, E_END)); // keep real entries
  s = s.replace(ABOUT_RE, (_m, a, _inner, c) => a + instance.match(ABOUT_RE)[2] + c); // keep real About
  result = s; target = instanceFile;

  // validate
  if (tokensLeft(result)) die(`push produced ${tokensLeft(result)} unresolved token(s) — aborting`);
  const want = countEntries(instance), got = countEntries(result);
  if (got !== want) die(`push entry-count mismatch (instance=${want}, result=${got}) — aborting`);
  out = `push: template engine → ${target}\n  entries preserved: ${got}\n  identity: ${id.project} · ${id.repo} · ${id.branch}`;
} else {
  // instance engine → template, swap in template's placeholder entries + About, re-tokenize identity
  let s = instance;
  s = replaceBetween(s, E_START, E_END, between(template, E_START, E_END)); // placeholder entries
  s = s.replace(ABOUT_RE, (_m, a, _inner, c) => a + template.match(ABOUT_RE)[2] + c); // placeholder About
  s = retokenize(s);
  result = s; target = TEMPLATE;

  // validate
  if (!result.includes("__PROJECT__") || !result.includes("__REPO_URL__")) die("pull failed to re-tokenize identity — aborting");
  const concreteUrl = gitId(repo).repo;
  if (concreteUrl && result.includes(concreteUrl)) die(`pull left the concrete repo url (${concreteUrl}) in the template — aborting`);
  if (countEntries(result) !== countEntries(template)) die("pull did not restore the template's placeholder entries — aborting");
  out = `pull: ${instanceFile} engine → template\n  placeholder entries restored: ${countEntries(result)}\n  identity re-tokenized`;
}

console.log(out);
if (dry) { console.log("--dry: nothing written."); process.exit(0); }
if (result === readFileSync(target, "utf8")) { console.log("✓ already in sync — nothing to write."); process.exit(0); }
writeFileSync(`${target}.bak`, readFileSync(target, "utf8"));
writeFileSync(target, result);
console.log(`✓ wrote ${target} (backup at ${target}.bak)`);
