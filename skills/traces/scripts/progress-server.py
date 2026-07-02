#!/usr/bin/env python3
# progress-server.py — serves progress/ (GET) AND lets the in-page checkbox
# flip live preview by writing progress/preview.json (POST /api/preview).
# A plain `python3 -m http.server` is GET-only, so the checkbox couldn't
# persist anything the agent can read; this can. Used by progress-tunnel.sh.
#
#   python3 scripts/progress-server.py [port] [dir]
import json, os, sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
DIR = sys.argv[2] if len(sys.argv) > 2 else "progress"
PREVIEW = os.path.join(DIR, "preview.json")


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        # Non-mutating probe + state read for the in-page checkbox.
        if self.path.rstrip("/") == "/api/preview":
            cfg = {}
            if os.path.exists(PREVIEW):
                try:
                    cfg = json.load(open(PREVIEW))
                except Exception:
                    cfg = {}
            out = json.dumps({"ok": True, "tunnel": bool(cfg.get("tunnel"))}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(out)
            return
        super().do_GET()

    def do_POST(self):
        if self.path.rstrip("/") != "/api/preview":
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n) or b"{}")
            cfg = {}
            if os.path.exists(PREVIEW):
                try:
                    cfg = json.load(open(PREVIEW))
                except Exception:
                    cfg = {}
            cfg["tunnel"] = bool(body.get("tunnel"))
            with open(PREVIEW, "w") as f:
                json.dump(cfg, f, indent=2)
                f.write("\n")
            out = json.dumps({"ok": True, "tunnel": cfg["tunnel"]}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(out)
        except Exception as e:  # noqa: BLE001
            self.send_response(400)
            self.end_headers()
            self.wfile.write(str(e).encode())


ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=DIR)).serve_forever()
