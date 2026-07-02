// Build a self-contained, single-file copy of progress/index.html with every
// referenced image/video inlined as a base64 data URI. Output is fully portable
// and interactive (the sort toggle still works) — meant to be sent straight to
// the user so they can SEE the page without cloning/pulling the repo.
//
//   node scripts/progress-standalone.mjs [outPath]
//   default outPath: /tmp/Progress.html
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = join(root, "progress", "index.html");
const out = process.argv[2] ?? "/tmp/Progress.html";

const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4" };

let html = readFileSync(srcPath, "utf8");
let inlined = 0, skipped = 0;
html = html.replace(/(src|href)="(media\/[^"]+)"/g, (m, attr, rel) => {
  try {
    const buf = readFileSync(join(root, "progress", rel));
    inlined++;
    return `${attr}="data:${mime[extname(rel).toLowerCase()] ?? "application/octet-stream"};base64,${buf.toString("base64")}"`;
  } catch {
    skipped++; // e.g. the skeleton template's placeholder FILENAME.png — leave as-is
    return m;
  }
});

writeFileSync(out, html);
console.log(`wrote ${out}  (${inlined} media inlined, ${skipped} left as-is)`);
