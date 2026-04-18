#!/usr/bin/env python3
"""AllerVision web UI — login gate, live feed with detection overlays."""

from __future__ import annotations

import logging
import threading
import time

import cv2
from flask import Flask, Response, jsonify, redirect, render_template_string, request, session

from config import Settings
from pipeline import FrameState, run_pipeline
from uploader import login as backend_login

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = Flask(__name__)
app.secret_key = "allervision-session-key"

_state = FrameState()
_stop = threading.Event()
_settings: Settings | None = None
_pipeline_thread: threading.Thread | None = None
_pipeline_lock = threading.Lock()

# ── Login page ────────────────────────────────────────────────────────

_LOGIN_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AllerVision — Sign In</title>
<style>
  :root {
    --bg-primary: #0a0a0c;
    --bg-card: #131318;
    --border: #1e1e28;
    --border-hover: #2d2d3a;
    --accent: #6ee7a0;
    --accent-dim: #3a8c5c;
    --accent-glow: rgba(110, 231, 160, 0.08);
    --text-primary: #e8e8ed;
    --text-secondary: #8888a0;
    --text-muted: #55556a;
    --danger: #f06070;
    --radius: 14px;
    --radius-sm: 10px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }
  .login-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 40px 36px 36px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  }
  .logo-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }
  .logo-mark {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), #3ecf8e);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #0a0a0c;
  }
  .logo-row h1 {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  input[type="email"], input[type="password"] {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 16px;
  }
  input:focus {
    border-color: var(--accent-dim);
  }
  button {
    width: 100%;
    padding: 11px;
    background: var(--accent);
    color: #0a0a0c;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  button:hover { opacity: 0.85; }
  .error {
    background: rgba(240, 96, 112, 0.1);
    border: 1px solid rgba(240, 96, 112, 0.3);
    color: var(--danger);
    font-size: 0.8rem;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    margin-bottom: 16px;
  }
</style>
</head>
<body>
  <div class="login-card">
    <div class="logo-row">
      <div class="logo-mark">AV</div>
      <h1>AllerVision</h1>
    </div>
    {% if error %}
    <div class="error">{{ error }}</div>
    {% endif %}
    <form method="POST" action="/login">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required autofocus>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required>
      <button type="submit">Sign In</button>
    </form>
  </div>
</body>
</html>
"""

# ── Dashboard page ────────────────────────────────────────────────────

_DASH_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AllerVision</title>
<style>
  :root {
    --bg-primary: #0a0a0c;
    --bg-card: #131318;
    --bg-card-hover: #1a1a22;
    --border: #1e1e28;
    --border-hover: #2d2d3a;
    --accent: #6ee7a0;
    --accent-dim: #3a8c5c;
    --accent-glow: rgba(110, 231, 160, 0.08);
    --text-primary: #e8e8ed;
    --text-secondary: #8888a0;
    --text-muted: #55556a;
    --danger: #f06070;
    --danger-dim: rgba(240, 96, 112, 0.12);
    --radius: 14px;
    --radius-sm: 10px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  header {
    position: sticky; top: 0; z-index: 100; width: 100%;
    padding: 0 28px; height: 56px;
    background: rgba(10, 10, 12, 0.85);
    backdrop-filter: blur(16px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 14px;
  }
  .logo-mark {
    width: 28px; height: 28px; border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), #3ecf8e);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #0a0a0c;
  }
  header h1 { font-size: 1.05rem; font-weight: 600; letter-spacing: -0.02em; }
  .header-badge {
    font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--accent);
    background: var(--accent-glow);
    border: 1px solid rgba(110, 231, 160, 0.15);
    padding: 3px 8px; border-radius: 6px;
  }
  .header-spacer { flex: 1; }
  .header-status {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.78rem; color: var(--text-secondary);
  }
  .pulse {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--accent);
    animation: pulse-ring 2s ease-out infinite;
  }
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(110,231,160,0.5); }
    70% { box-shadow: 0 0 0 6px rgba(110,231,160,0); }
    100% { box-shadow: 0 0 0 0 rgba(110,231,160,0); }
  }
  .logout-btn {
    font-size: 0.72rem; color: var(--text-muted);
    background: none; border: 1px solid var(--border);
    padding: 4px 10px; border-radius: 6px; cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .logout-btn:hover { border-color: var(--border-hover); color: var(--text-secondary); }
  .layout {
    display: grid; grid-template-columns: 1fr 360px;
    gap: 20px; padding: 20px 28px;
    max-width: 1440px; margin: 0 auto;
    min-height: calc(100vh - 56px);
  }
  .feed-panel { display: flex; flex-direction: column; gap: 14px; }
  .feed-container {
    position: relative; border-radius: var(--radius);
    overflow: hidden; border: 1px solid var(--border);
    background: #000;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.02), 0 8px 40px rgba(0,0,0,0.5);
  }
  .feed-container img { width: 100%; display: block; }
  .feed-live-badge {
    position: absolute; top: 12px; left: 12px;
    display: flex; align-items: center; gap: 5px;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    padding: 4px 10px; border-radius: 6px;
    font-size: 0.7rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent);
  }
  .feed-live-badge .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #f04040; animation: blink 1.2s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .stats { display: flex; gap: 10px; flex-wrap: wrap; }
  .stat {
    flex: 1; min-width: 120px;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 12px 14px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .stat-label {
    font-size: 0.68rem; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--text-muted);
  }
  .stat-value {
    font-size: 1.4rem; font-weight: 700; letter-spacing: -0.03em;
    color: var(--text-primary); font-variant-numeric: tabular-nums;
  }
  .stat-value.accent { color: var(--accent); }
  .log-panel { display: flex; flex-direction: column; gap: 0; min-height: 0; }
  .log-header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 12px;
  }
  .log-header h2 { font-size: 0.9rem; font-weight: 600; }
  .log-count {
    font-size: 0.72rem; color: var(--text-muted);
    background: var(--bg-card); border: 1px solid var(--border);
    padding: 2px 8px; border-radius: 6px; font-variant-numeric: tabular-nums;
  }
  .log-list {
    display: flex; flex-direction: column; gap: 8px;
    overflow-y: auto; flex: 1; padding-right: 4px; min-height: 0;
  }
  .log-list::-webkit-scrollbar { width: 5px; }
  .log-list::-webkit-scrollbar-track { background: transparent; }
  .log-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .log-entry {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); overflow: hidden;
    transition: border-color 0.2s, background 0.2s;
    display: grid; grid-template-columns: 100px 1fr;
  }
  .log-entry:hover { border-color: var(--border-hover); background: var(--bg-card-hover); }
  .log-entry.failed { border-color: rgba(240, 96, 112, 0.3); }
  .log-thumb { width: 100px; height: 72px; object-fit: cover; display: block; background: #0a0a0c; }
  .log-body {
    padding: 10px 12px; display: flex; flex-direction: column;
    justify-content: center; gap: 4px; min-width: 0;
  }
  .log-labels {
    font-size: 0.8rem; font-weight: 500; color: var(--text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .log-time { font-size: 0.7rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .log-status-ok {
    display: inline-block; font-size: 0.62rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--accent); background: var(--accent-glow);
    padding: 1px 6px; border-radius: 4px; margin-left: 6px;
  }
  .log-status-fail {
    display: inline-block; font-size: 0.62rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--danger); background: rgba(240,96,112,0.12);
    padding: 1px 6px; border-radius: 4px; margin-left: 6px;
  }
  .log-count-badge {
    display: inline-block; font-size: 0.68rem; font-weight: 600;
    color: var(--text-secondary); background: var(--bg-primary);
    border: 1px solid var(--border); padding: 0 5px;
    border-radius: 4px; margin-left: 4px; vertical-align: middle;
  }
  .empty-log {
    color: var(--text-muted); font-size: 0.82rem; text-align: center;
    padding: 60px 0; border: 1px dashed var(--border); border-radius: var(--radius-sm);
  }
  .pager {
    display: flex; gap: 4px; justify-content: center; padding-top: 10px;
  }
  .pager button {
    background: var(--bg-card); border: 1px solid var(--border);
    color: var(--text-secondary); border-radius: 6px;
    padding: 4px 10px; font-size: 0.72rem; cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .pager button:hover { border-color: var(--border-hover); color: var(--text-primary); }
  .pager button.active {
    background: var(--accent-glow); border-color: var(--accent-dim);
    color: var(--accent); font-weight: 600;
  }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
    .log-panel { max-height: 420px; }
  }
</style>
</head>
<body>
  <header>
    <div class="logo-mark">AV</div>
    <h1>AllerVision</h1>
    <span class="header-badge">Live</span>
    <div class="header-spacer"></div>
    <div class="header-status">
      <span class="pulse"></span>
      <span>Welcome back, {{ user_email }}</span>
    </div>
    <a class="logout-btn" href="/logout">Sign out</a>
  </header>
  <div class="layout">
    <div class="feed-panel">
      <div class="feed-container">
        <div class="feed-live-badge"><span class="dot"></span> LIVE</div>
        <img src="/feed" alt="Live camera feed">
      </div>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Detections</span>
          <span class="stat-value accent" id="dets">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Uploaded</span>
          <span class="stat-value" id="uploads">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Dupes Skipped</span>
          <span class="stat-value" id="dupes">0</span>
        </div>
      </div>
    </div>
    <div class="log-panel">
      <div class="log-header">
        <h2>Upload History</h2>
        <span class="log-count" id="log-count">0 items</span>
      </div>
      <div class="log-list" id="log-list">
        <div class="empty-log" id="empty-log">Waiting for detections&hellip;</div>
      </div>
      <div class="pager" id="pager"></div>
    </div>
  </div>
  <script>
    let knownCount = 0, currentPage = 1;
    const PER_PAGE = 10;

    function renderEntry(e) {
      const div = document.createElement("div");
      div.className = "log-entry" + (e.success ? "" : " failed");
      const tag = e.success
        ? '<span class="log-status-ok">sent</span>'
        : '<span class="log-status-fail">failed</span>';
      const countTag = e.count > 1
        ? ' <span class="log-count-badge">&times;' + e.count + '</span>'
        : '';
      div.innerHTML =
        '<img class="log-thumb" src="data:image/jpeg;base64,' + e.thumbnail + '" alt="Detected food">' +
        '<div class="log-body">' +
          '<div class="log-labels">' + e.labels.join(", ") + countTag + '</div>' +
          '<div class="log-time">' + e.timestamp + tag + '</div>' +
        '</div>';
      return div;
    }

    async function loadPage(page) {
      currentPage = page;
      const lr = await fetch("/uploads?page=" + page);
      const d = await lr.json();
      const list = document.getElementById("log-list");
      const empty = document.getElementById("empty-log");
      if (empty) empty.remove();
      list.innerHTML = "";
      d.items.forEach(e => list.appendChild(renderEntry(e)));
      renderPager(d.total, d.page);
    }

    function renderPager(total, page) {
      const pages = Math.ceil(total / PER_PAGE);
      const pager = document.getElementById("pager");
      if (pages <= 1) { pager.innerHTML = ""; return; }
      let html = "";
      if (page > 1) html += '<button onclick="loadPage(' + (page-1) + ')">&lsaquo;</button>';
      for (let i = 1; i <= pages; i++) {
        html += '<button class="' + (i===page?'active':'') + '" onclick="loadPage(' + i + ')">' + i + '</button>';
      }
      if (page < pages) html += '<button onclick="loadPage(' + (page+1) + ')">&rsaquo;</button>';
      pager.innerHTML = html;
    }

    async function poll() {
      try {
        const r = await fetch("/stats");
        if (r.status === 401) { location.href = "/"; return; }
        const d = await r.json();
        document.getElementById("uploads").textContent = d.uploads;
        document.getElementById("dupes").textContent = d.duplicates_skipped;
        document.getElementById("dets").textContent = d.detections;
        document.getElementById("log-count").textContent = d.log_count + " item" + (d.log_count === 1 ? "" : "s");
        if (d.log_count !== knownCount) {
          knownCount = d.log_count;
          loadPage(currentPage);
        }
      } catch {}
    }
    setInterval(poll, 1000);
  </script>
</body>
</html>
"""


# ── Helpers ───────────────────────────────────────────────────────────

def _require_auth():
    """Return True if the user is logged in."""
    return "token" in session


def _start_pipeline(token: str) -> None:
    """Start the detection pipeline (once) with the given JWT."""
    global _pipeline_thread
    with _pipeline_lock:
        if _pipeline_thread is not None and _pipeline_thread.is_alive():
            return
        _stop.clear()
        _pipeline_thread = threading.Thread(
            target=run_pipeline,
            args=(_settings, _state, _stop),
            kwargs={"token": token},
            daemon=True,
        )
        _pipeline_thread.start()


# ── Routes ────────────────────────────────────────────────────────────

@app.route("/")
def index():
    if not _require_auth():
        return render_template_string(_LOGIN_HTML, error=None)
    return render_template_string(_DASH_HTML, user_email=session["email"])


@app.route("/login", methods=["POST"])
def do_login():
    email = request.form.get("email", "").strip()
    password = request.form.get("password", "")
    try:
        token, user_email = backend_login(_settings.backend_url, email, password)
    except Exception:
        return render_template_string(_LOGIN_HTML, error="Invalid email or password"), 401

    session["token"] = token
    session["email"] = user_email
    logging.getLogger("allervision").info("Welcome back, %s", user_email)
    _start_pipeline(token)
    return redirect("/")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


@app.route("/stats")
def stats():
    if not _require_auth():
        return jsonify({"error": "unauthorized"}), 401
    with _state.lock:
        return jsonify({
            "uploads": _state.uploads_count,
            "duplicates_skipped": _state.duplicates_skipped,
            "detections": len(_state.detections),
            "log_count": len(_state.upload_log),
        })


@app.route("/uploads")
def uploads():
    if not _require_auth():
        return jsonify({"error": "unauthorized"}), 401
    page = request.args.get("page", 1, type=int)
    per_page = 10
    with _state.lock:
        total = len(_state.upload_log)
        start = (page - 1) * per_page
        page_items = _state.upload_log[start:start + per_page]
        items = [
            {
                "timestamp": e.timestamp,
                "labels": e.labels,
                "thumbnail": e.thumbnail_b64,
                "success": e.success,
                "count": e.count,
            }
            for e in page_items
        ]
    return jsonify({"items": items, "total": total, "page": page})


def _generate_mjpeg():
    """Yield MJPEG frames. Reads the latest annotated frame without blocking."""
    last_id = id(None)
    while not _stop.is_set():
        frame = _state.frame  # atomic read, no lock needed for reference
        fid = id(frame)
        if frame is None or fid == last_id:
            time.sleep(0.016)
            continue
        last_id = fid
        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if not ok:
            continue
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"
        )


@app.route("/feed")
def feed():
    if not _require_auth():
        return "", 401
    return Response(
        _generate_mjpeg(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


def main() -> None:
    global _settings
    _settings = Settings()  # type: ignore[call-arg]

    port = 8501
    logging.getLogger("allervision").info("AllerVision UI at http://localhost:%d", port)

    try:
        app.run(host="0.0.0.0", port=port, threaded=True)
    finally:
        _stop.set()
        if _pipeline_thread is not None:
            _pipeline_thread.join(timeout=5)


if __name__ == "__main__":
    main()
