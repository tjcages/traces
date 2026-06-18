// progress-shot.mjs — capture a Traces screenshot at a REAL viewport.
// Headless Chrome's --window-size doesn't set the layout viewport (it renders
// wide and crops), so mobile shots come out clipped. This drives Chrome over
// the DevTools protocol with proper device-metrics emulation instead.
//
//   node scripts/progress-shot.mjs <url> <out.png> [width=375] [height=760] [mobile|desktop]
//
// e.g.  node scripts/progress-shot.mjs http://localhost:8901/index.html \
//          progress/media/2026-06-13-mobile.png 375 760 mobile
//
// Serve progress/ first (the `progress` entry in .claude/launch.json, or
// `python3 -m http.server -d progress`).
//
// AUTHED APP SHOTS (capture a signed-in screen of the running dev app):
// the app gates pages behind auth, so a fresh headless Chrome lands on
// /sign-in. Inject a session cookie via SHOT_COOKIE="name=value". In local
// dev the key-free login mints one for you — one-liner:
//   TOKEN=$(curl -s -X POST localhost:5173/api/dev-login \
//     -H 'content-type: application/json' -d '{"email":"you@example.com"}' \
//     | sed -E 's/.*"token":"([^"]+)".*/\1/')
//   SHOT_COOKIE="better-auth.session_token=$TOKEN" \
//     node scripts/progress-shot.mjs "http://localhost:5173/<deep-link>" \
//       progress/media/<name>.png 1000 720 desktop
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const URL = process.argv[2];
const OUT = process.argv[3];
const W = +process.argv[4] || 375;
const H = +process.argv[5] || 760;
const MOBILE = process.argv[6] !== 'desktop';
const EVAL = process.argv[7]; // optional JS to run before capture (e.g. force a hover state)
const PORT = 9334;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--no-sandbox', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=/tmp/cdp-${process.pid}`, 'about:blank',
], { stdio: 'ignore' });

async function wsUrl() {
  for (let i = 0; i < 50; i++) {
    try { const j = await (await fetch(`http://localhost:${PORT}/json/version`)).json(); if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl; } catch {}
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error('no devtools');
}

const ws = new WebSocket(await wsUrl());
let nextId = 1; const pending = new Map(); const waiters = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) waiters.slice().forEach(w => w(m));
});
await new Promise(res => ws.addEventListener('open', res));
const send = (method, params = {}, sessionId) => new Promise(resolve => { const id = nextId++; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params, sessionId })); });
const onceEvent = (method, sid) => new Promise(resolve => { const w = m => { if (m.method === method && (!sid || m.sessionId === sid)) { waiters.splice(waiters.indexOf(w), 1); resolve(m); } }; waiters.push(w); });

const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId: sid } } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sid);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: MOBILE }, sid);
// Force a deterministic colour scheme (light by default; SHOT_SCHEME=dark to override).
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: process.env.SHOT_SCHEME || 'light' }] }, sid);
// Optional auth: SHOT_COOKIE="name=value" seeds a session cookie so authed app
// screens render signed-in instead of bouncing to /sign-in. (value may contain
// '=' — split on the first one only.)
if (process.env.SHOT_COOKIE) {
  const raw = process.env.SHOT_COOKIE;
  const eq = raw.indexOf('=');
  const name = raw.slice(0, eq);
  const value = raw.slice(eq + 1);
  const { hostname } = new globalThis.URL(URL);
  await send('Network.setCookie', { name, value, domain: hostname, path: '/' }, sid);
}
const loaded = onceEvent('Page.loadEventFired', sid);
await send('Page.navigate', { url: URL }, sid);
await loaded;
await new Promise(r => setTimeout(r, 1600));
if (EVAL) { await send('Runtime.evaluate', { expression: EVAL }, sid); await new Promise(r => setTimeout(r, 350)); }
const { result: { data } } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sid);
writeFileSync(OUT, Buffer.from(data, 'base64'));
ws.close(); chrome.kill();
console.log('saved', OUT, `${W}x${H}`, MOBILE ? 'mobile' : 'desktop');
process.exit(0);
