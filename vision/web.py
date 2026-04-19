#!/usr/bin/env python3
"""AllerSight for Businesses — ingredient tracking web UI."""

from __future__ import annotations

import logging
import os
import threading
import time

import cv2
import json as _json
import urllib.request
import urllib.error
from flask import Flask, Response, jsonify, render_template_string, request

from config import Settings
from pipeline import FrameState, run_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s")

app = Flask(__name__)
app.secret_key = "allersight-biz-session"

_state = FrameState()
_stop = threading.Event()
_settings: Settings | None = None
_pipeline_thread: threading.Thread | None = None

_BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
_BASE_PATH = os.getenv("BASE_PATH", "")  # e.g. "/business" when behind nginx

# ── Shared CSS tokens (mirrors frontend/src/index.css :root) ──────────
_CSS = """\
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
:root{
  --cream:#f4f1ea;--ink:#15211a;--green:#1f3d2b;--terra:#d97757;
  --muted:rgba(21,33,26,0.55);--border:rgba(21,33,26,0.12);
  --card:#fff;--radius:14px;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:var(--cream);color:var(--ink);font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
a{color:inherit;text-decoration:none}
"""

# ── Brand mark (same as frontend BrandMark.tsx) ──────────────────────
_BRAND_MARK = """\
<span class="brand-mark">aller<span class="lens-o"></span>sight</span>
"""

# ── Login page ────────────────────────────────────────────────────────
_LOGIN_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AllerSight for Business</title>
<style>
""" + _CSS + """
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.login-card{width:100%;max-width:380px;text-align:center}
.brand-mark{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:38px;letter-spacing:-0.5px;display:inline-flex;align-items:baseline}
.lens-o{display:inline-block;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--terra);margin-left:2px;position:relative;top:-1px}
.lens-o::after{content:'';position:absolute;inset:7px;border-radius:50%;background:var(--terra)}
.subtitle{font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:var(--muted);font-weight:500;margin-top:6px}
.login-card form{margin-top:40px;display:flex;flex-direction:column;gap:14px;text-align:left}
.field label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);font-weight:600;display:block;margin-bottom:6px}
.field input{width:100%;padding:12px 14px;border-radius:10px;border:0.5px solid var(--border);background:var(--card);font-family:'Inter',system-ui,sans-serif;font-size:14px;color:var(--ink);outline:none;transition:border-color .15s}
.field input:focus{border-color:var(--terra)}
.login-btn{margin-top:8px;padding:13px;border-radius:999px;border:none;background:var(--ink);color:var(--cream);font-family:'Inter',system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.5px;cursor:pointer;transition:background .15s}
.login-btn:hover{background:var(--green)}
.error{color:var(--terra);font-size:13px;text-align:center;min-height:20px;margin-top:4px}
</style>
</head>
<body>
<div class="login-wrap">
  <div class="login-card">
    """ + _BRAND_MARK + """
    <div class="subtitle">for business</div>
    <form id="login-form">
      <div class="field"><label>Email</label><input type="email" id="email" required autocomplete="email"></div>
      <div class="field"><label>Password</label><input type="password" id="password" required autocomplete="current-password"></div>
      <div class="error" id="error"></div>
      <button type="submit" class="login-btn">Sign in</button>
    </form>
  </div>
</div>
<script>
document.getElementById('login-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const err=document.getElementById('error');
  err.textContent='';
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('password').value})});
    const d=await r.json();
    if(!r.ok){err.textContent=d.error||'Login failed';return}
    sessionStorage.setItem('token',d.token);
    sessionStorage.setItem('email',d.email);
    location.href='BASE_PATH/dashboard';
  }catch(ex){err.textContent='Cannot reach server'}
});
</script>
</body>
</html>
"""

# ── Dashboard page ────────────────────────────────────────────────────
_DASH_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AllerSight for Business</title>
<style>
""" + _CSS + """
/* header */
header{position:sticky;top:0;z-index:50;background:rgba(244,241,234,0.88);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);border-bottom:0.5px solid var(--border)}
.nav{max-width:1280px;margin:0 auto;padding:16px 32px;display:flex;align-items:center;gap:16px}
.brand-mark{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:24px;letter-spacing:-0.5px;display:inline-flex;align-items:baseline}
.lens-o{display:inline-block;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--terra);margin-left:2px;position:relative;top:-1px}
.lens-o::after{content:'';position:absolute;inset:5px;border-radius:50%;background:var(--terra)}
.nav .tag{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--terra);font-weight:600;background:rgba(217,119,87,0.1);border:0.5px solid rgba(217,119,87,0.2);padding:3px 8px;border-radius:6px}
.spacer{flex:1}
.nav .user{font-size:12px;color:var(--muted)}
.nav .logout{padding:7px 14px;border-radius:999px;border:0.5px solid var(--border);background:transparent;font-family:'Inter',system-ui,sans-serif;font-size:11px;font-weight:500;color:var(--ink);cursor:pointer;transition:background .15s}
.nav .logout:hover{background:rgba(21,33,26,0.06)}

/* layout */
.layout{max-width:1280px;margin:0 auto;padding:24px 32px;display:grid;grid-template-columns:1fr 380px;gap:20px;min-height:calc(100vh - 56px)}
@media(max-width:900px){.layout{grid-template-columns:1fr}}

/* feed */
.feed-box{position:relative;border-radius:var(--radius);overflow:hidden;border:0.5px solid var(--border);background:var(--ink)}
.feed-box img{width:100%;display:block}
.feed-disabled{display:flex;align-items:center;justify-content:center;min-height:360px;color:var(--muted);font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:18px}
.live-badge{position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:6px;background:rgba(21,33,26,0.7);backdrop-filter:blur(8px);padding:5px 10px;border-radius:8px;font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--cream)}
.live-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--terra);animation:blink 1.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

/* banners */
.alert-banner{display:none;padding:12px 16px;border-radius:10px;background:rgba(217,119,87,0.08);border:0.5px solid rgba(217,119,87,0.25);color:var(--terra);font-size:13px;font-weight:500;margin-top:14px}
.alert-banner.show{display:block}
.cleared-banner{display:none;padding:12px 16px;border-radius:10px;background:rgba(31,61,43,0.08);border:0.5px solid rgba(31,61,43,0.2);color:var(--green);font-size:13px;font-weight:500;margin-top:14px}
.cleared-banner.show{display:block}

/* sidebar cards */
.side{display:flex;flex-direction:column;gap:16px}
.card{background:var(--card);border:0.5px solid var(--border);border-radius:var(--radius);padding:18px}
.card h2{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:22px;letter-spacing:-0.5px;margin-bottom:14px;display:flex;align-items:center;gap:10px}
.card h2 .count{font-family:'Inter',system-ui,sans-serif;font-size:10px;letter-spacing:1.6px;color:var(--muted);background:var(--cream);border:0.5px solid var(--border);padding:2px 8px;border-radius:6px;font-weight:600}

/* ingredient list */
.ing-list{display:flex;flex-direction:column;gap:6px;max-height:45vh;overflow-y:auto}
.ing{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:0.5px solid var(--border);transition:background .15s}
.ing:hover{background:var(--cream)}
.ing.allergen{border-color:rgba(217,119,87,0.35);background:rgba(217,119,87,0.04)}
.ing-name{flex:1;font-size:14px;font-weight:500}
.ing-tag{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:5px}
.tag-allergen{color:var(--terra);background:rgba(217,119,87,0.1)}
.tag-safe{color:var(--green);background:rgba(31,61,43,0.08)}
.ing-time{font-size:11px;color:var(--muted)}

/* wash log */
.clear-list{display:flex;flex-direction:column;gap:6px}
.clear-entry{font-size:13px;color:var(--ink);padding:8px 0;border-bottom:0.5px solid var(--border);display:flex;justify-content:space-between}
.clear-entry .t{font-size:11px;color:var(--muted)}
.empty{color:var(--muted);font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:15px;text-align:center;padding:30px 0}

/* settings */
.settings-row{display:flex;gap:8px}
.settings-row input{flex:1;padding:10px 12px;border-radius:10px;border:0.5px solid var(--border);background:var(--cream);font-family:'Inter',system-ui,sans-serif;font-size:13px;color:var(--ink);outline:none}
.settings-row input:focus{border-color:var(--terra)}
.settings-row button{padding:10px 16px;border-radius:10px;border:none;background:var(--ink);color:var(--cream);font-family:'Inter',system-ui,sans-serif;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s}
.settings-row button:hover{background:var(--green)}
.cam-status{font-size:11px;color:var(--muted);margin-top:8px}
</style>
</head>
<body>
<header>
  <div class="nav">
    """ + _BRAND_MARK + """
    <span class="tag">Business</span>
    <div class="spacer"></div>
    <span class="user" id="user-email"></span>
    <button class="logout" onclick="sessionStorage.clear();location.href='BASE_PATH/'">Sign out</button>
  </div>
</header>
<div class="layout">
  <div class="feed-panel">
    <div class="feed-box" id="feed-box">
      <div class="feed-disabled" id="feed-off">Set a camera URL in settings to start</div>
      <div class="live-badge" id="live-badge" style="display:none"><span class="dot"></span>Live</div>
      <img id="feed-img" src="" alt="Live camera feed" style="display:none">
    </div>
    <div class="alert-banner" id="alert"></div>
    <div class="cleared-banner" id="cleared"></div>
  </div>
  <div class="side">
    <div class="card">
      <h2>Ingredients <span class="count" id="ing-count">0</span></h2>
      <div class="ing-list" id="ing-list"><div class="empty">No ingredients detected yet</div></div>
    </div>
    <div class="card">
      <h2>Wash log</h2>
      <div class="clear-list" id="clear-list"><div class="empty">No washes recorded</div></div>
    </div>
    <div class="card">
      <h2>Settings</h2>
      <div class="settings-row">
        <input type="text" id="cam-url" placeholder="Camera URL (MJPEG / RTSP)">
        <button onclick="setCam()">Apply</button>
      </div>
      <div class="cam-status" id="cam-status"></div>
    </div>
  </div>
</div>
<script>
if(!sessionStorage.getItem('token'))location.href='BASE_PATH/';
document.getElementById('user-email').textContent=sessionStorage.getItem('email')||'';
function showFeed(url){
  const on=!!url;
  document.getElementById('feed-off').style.display=on?'none':'flex';
  document.getElementById('live-badge').style.display=on?'flex':'none';
  const img=document.getElementById('feed-img');
  if(on){img.src='/feed?t='+Date.now();img.style.display='block'}else{img.src='';img.style.display='none'}
}
fetch('/api/settings').then(r=>r.json()).then(d=>{document.getElementById('cam-url').value=d.camera_url||'';showFeed(d.camera_url)});
async function setCam(){
  const s=document.getElementById('cam-status');
  s.textContent='Applying…';
  try{
    const r=await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({camera_url:document.getElementById('cam-url').value})});
    const d=await r.json();
    s.textContent=r.ok?'Camera updated — restarting feed…':d.error||'Failed';
    if(r.ok)setTimeout(()=>{showFeed(d.camera_url);s.textContent=''},2000);
  }catch(e){s.textContent='Error'}
}
let prevClearCount=0;
async function poll(){
  try{
    const r=await fetch('/api/state');const d=await r.json();
    document.getElementById('ing-count').textContent=d.ingredients.length;
    const list=document.getElementById('ing-list');
    if(!d.ingredients.length){list.innerHTML='<div class="empty">No ingredients detected yet</div>'}
    else{list.innerHTML=d.ingredients.map(i=>{
      const isA=i.allergens.length>0;
      const tags=isA?i.allergens.map(a=>'<span class="ing-tag tag-allergen">\\u26a0 '+a+'</span>').join(''):'<span class="ing-tag tag-safe">safe</span>';
      return '<div class="ing'+(isA?' allergen':'')+'"><span class="ing-name">'+i.name+(i.count>1?' \\xd7'+i.count:'')+'</span>'+tags+'<span class="ing-time">'+i.first_seen+'</span></div>'
    }).join('')}
    const allergens=d.ingredients.filter(i=>i.allergens.length>0);
    const ab=document.getElementById('alert');
    if(allergens.length){ab.textContent='\\u26a0 Allergen alert: '+allergens.map(i=>i.name).join(', ')+' \\u2014 handle with care';ab.classList.add('show')}else{ab.classList.remove('show')}
    const cb=document.getElementById('cleared');
    if(d.clear_log.length>prevClearCount){cb.textContent='\\ud83e\\uddfc Station cleared \\u2014 '+d.clear_log[0].ingredients_cleared+' ingredients washed at '+d.clear_log[0].timestamp;cb.classList.add('show');setTimeout(()=>cb.classList.remove('show'),5000)}
    prevClearCount=d.clear_log.length;
    const cl=document.getElementById('clear-list');
    if(!d.clear_log.length){cl.innerHTML='<div class="empty">No washes recorded</div>'}
    else{cl.innerHTML=d.clear_log.map(c=>'<div class="clear-entry"><span>Cleared '+c.ingredients_cleared+' ingredients</span><span class="t">'+c.timestamp+'</span></div>').join('')}
  }catch{}
}
setInterval(poll,800);
</script>
</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(_LOGIN_HTML.replace("BASE_PATH", _BASE_PATH))


@app.route("/dashboard")
def dashboard():
    return render_template_string(_DASH_HTML.replace("BASE_PATH", _BASE_PATH))


@app.route("/api/state")
def api_state():
    with _state.lock:
        return jsonify({
            "ingredients": [
                {"name": i.name, "allergens": i.allergens, "first_seen": i.first_seen, "count": i.count}
                for i in _state.ingredients
            ],
            "clear_log": [
                {"timestamp": c.timestamp, "ingredients_cleared": c.ingredients_cleared}
                for c in _state.clear_log
            ],
        })


@app.route("/api/login", methods=["POST"])
def api_login():
    try:
        body = _json.dumps(request.get_json()).encode()
        req = urllib.request.Request(
            f"{_BACKEND_URL}/api/auth/login",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return Response(resp.read(), status=resp.status, content_type="application/json")
    except urllib.error.HTTPError as e:
        return Response(e.read(), status=e.code, content_type="application/json")
    except Exception:
        return jsonify({"error": "Cannot reach backend"}), 502


@app.route("/api/settings", methods=["GET"])
def api_settings_get():
    return jsonify({"camera_url": _settings.camera_url if _settings else ""})


@app.route("/api/settings", methods=["POST"])
def api_settings_post():
    global _settings, _pipeline_thread
    data = request.get_json()
    url = (data or {}).get("camera_url", "").strip()
    if not url:
        return jsonify({"error": "camera_url is required"}), 400

    # Stop current pipeline
    _stop.set()
    if _pipeline_thread:
        _pipeline_thread.join(timeout=5)

    # Update settings and restart
    _settings = Settings(camera_url=url)  # type: ignore[call-arg]
    _stop.clear()
    _state.frame = None
    _pipeline_thread = threading.Thread(
        target=run_pipeline, args=(_settings, _state, _stop), daemon=True,
    )
    _pipeline_thread.start()
    return jsonify({"ok": True, "camera_url": url})


def _generate_mjpeg():
    last_id = id(None)
    while not _stop.is_set():
        frame = _state.frame
        fid = id(frame)
        if frame is None or fid == last_id:
            time.sleep(0.016)
            continue
        last_id = fid
        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if not ok:
            continue
        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"


@app.route("/feed")
def feed():
    return Response(_generate_mjpeg(), mimetype="multipart/x-mixed-replace; boundary=frame")


def main() -> None:
    global _settings, _pipeline_thread
    _settings = Settings()  # type: ignore[call-arg]

    _stop.clear()
    if _settings.camera_url:
        _pipeline_thread = threading.Thread(
            target=run_pipeline, args=(_settings, _state, _stop), daemon=True,
        )
        _pipeline_thread.start()

    port = 8501
    logging.getLogger("allersight").info("AllerSight for Businesses at http://localhost:%d", port)
    try:
        app.run(host="0.0.0.0", port=port, threaded=True)
    finally:
        _stop.set()
        if _pipeline_thread:
            _pipeline_thread.join(timeout=5)


if __name__ == "__main__":
    main()
