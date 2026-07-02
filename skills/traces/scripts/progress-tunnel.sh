#!/usr/bin/env bash
# Serve progress/index.html locally and expose it through a Cloudflare quick
# tunnel — an obscure https://<random>.trycloudflare.com URL the user can open
# from anywhere. The URL is written to /tmp/progress-tunnel-url.txt.
#
# REQUIRES the environment's network egress policy to allow:
#   - api.trycloudflare.com            (HTTPS 443, quick-tunnel provisioning)
#   - *.argotunnel.com                 (TCP/UDP 7844, edge connectivity)
# If those are blocked you'll get: "Host not in allowlist: api.trycloudflare.com".
#
# Usage:  bash scripts/progress-tunnel.sh        # prints the public URL
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PROGRESS_PORT:-8765}"
HTTP_LOG=/tmp/progress-http.log
TUN_LOG=/tmp/progress-tunnel.log
URL_FILE=/tmp/progress-tunnel-url.txt

# 1) server for progress/ — serves files AND accepts the in-page live-preview
#    checkbox's POST /api/preview (writes preview.json). Idempotent: if a plain
#    GET-only server is already up, replace it so the checkbox works.
if ! curl -sf -o /dev/null "http://127.0.0.1:${PORT}/api/preview"; then   # GET probe (non-mutating)
  pkill -f "http.server ${PORT}" 2>/dev/null || true
  pkill -f "progress-server.py ${PORT}" 2>/dev/null || true
  sleep 0.3
  nohup python3 "${ROOT}/scripts/progress-server.py" "${PORT}" "${ROOT}/progress" >"${HTTP_LOG}" 2>&1 &
  sleep 0.6
fi

# 2) (re)start the quick tunnel — install cloudflared if this fresh container lacks it
if ! command -v cloudflared >/dev/null; then
  case "$(uname -m)" in
    x86_64|amd64) cfarch=amd64 ;;
    aarch64|arm64) cfarch=arm64 ;;
    *) echo "unsupported arch $(uname -m) for cloudflared" >&2; exit 1 ;;
  esac
  echo "installing cloudflared (${cfarch})..." >&2
  curl -fsSL -m 120 -o /usr/local/bin/cloudflared \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${cfarch}"
  chmod +x /usr/local/bin/cloudflared
fi
pkill -f "cloudflared tunnel .*127.0.0.1:${PORT}" 2>/dev/null || true
: >"${TUN_LOG}"
nohup cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:${PORT}" >"${TUN_LOG}" 2>&1 &

# 3) wait for the public URL (or a clear egress error)
for _ in $(seq 1 30); do
  url=$(grep -aoE 'https://[a-z0-9-]+\.trycloudflare\.com' "${TUN_LOG}" | head -1 || true)
  if [ -n "${url}" ]; then echo "${url}" | tee "${URL_FILE}"; exit 0; fi
  if grep -aq 'not in allowlist' "${TUN_LOG}"; then
    echo "BLOCKED: env egress must allow api.trycloudflare.com + *.argotunnel.com:7844" >&2
    exit 2
  fi
  sleep 1
done
echo "timed out waiting for tunnel URL; see ${TUN_LOG}" >&2
exit 1
