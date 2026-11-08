#!/usr/bin/env python3
"""
OpenChat V2 — Python backend (Flask)

Mirrors server.js exactly: same endpoints, same accounts.json format,
same scrypt password hashing, same session-token scheme.

Run locally:
    pip install flask requests yt-dlp
    python server.py

Deploy on PythonAnywhere (or any WSGI host):
    - upload this file + your built `dist/` folder
    - point the WSGI entry at:  from server import app as application
"""

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import subprocess
import sys
import time
from pathlib import Path

import requests
from flask import Flask, abort, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "dist"
ACCOUNTS_FILE = Path(os.environ.get("ACCOUNTS_FILE", BASE_DIR / "accounts.json"))
PORT = int(os.environ.get("PORT", "3000"))
GOOGLE_CLIENT_ID = os.environ.get(
    "GOOGLE_CLIENT_ID",
    "520658917291-nehsp0uaeau7vfevpuopea9n4ee2ssco.apps.googleusercontent.com",
)
DEFAULT_AVATAR = (
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?"
    "w=150&auto=format&fit=crop&q=80"
)
MUSIC_TRACK = "https://youtu.be/9suR53954uM"
MUSIC_CACHE_TTL_S = 6 * 60 * 60  # 6h

# ---------- tiny JSON "database" ----------
def load_db():
    try:
        with open(ACCOUNTS_FILE, "r", encoding="utf-8") as f:
            db = json.load(f)
        return {
            "accounts": db.get("accounts", []),
            "sessions": db.get("sessions", {}),
            "states": db.get("states", {}),
        }
    except Exception:
        return {"accounts": [], "sessions": {}, "states": {}}


def save_db(db):
    with open(ACCOUNTS_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)


def hash_password(password: str, salt_hex: str) -> str:
    # Must match Node's crypto.scryptSync defaults: N=16384, r=8, p=1, dkLen=64
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=bytes.fromhex(salt_hex),
        n=16384,
        r=8,
        p=1,
        dklen=64,
    ).hex()


def public_account(a):
    return {
        "id": a["id"],
        "username": a["username"],
        "discriminator": a.get("discriminator", "0000"),
        "avatar": a.get("avatar", DEFAULT_AVATAR),
        "email": a.get("email"),
        "createdAt": a.get("createdAt", 0),
    }


def account_for_token(db):
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        return None
    account_id = db["sessions"].get(token)
    if not account_id:
        return None
    for a in db["accounts"]:
        if a["id"] == account_id:
            return a
    return None


def issue_token(db, account_id):
    token = secrets.token_hex(48)
    db["sessions"][token] = account_id
    return token


app = Flask(__name__, static_folder=None)


@app.after_request
def add_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp


# ---------- API ----------
@app.get("/api/health")
def health():
    return jsonify(ok=True)


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    clean = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if len(clean) < 2 or len(clean) > 32:
        return jsonify(success=False, message="Username must be 2–32 characters."), 400
    if not re.match(r"^[A-Za-z0-9_.-]+$", clean):
        return jsonify(success=False, message="Username: letters, numbers, dots, dashes, underscores only."), 400
    if len(password) < 6:
        return jsonify(success=False, message="Password must be at least 6 characters."), 400

    db = load_db()
    if any(a["username"].lower() == clean.lower() for a in db["accounts"]):
        return jsonify(success=False, message="That username is already taken."), 409

    salt_hex = secrets.token_hex(16)
    account = {
        "id": f"acct-{int(time.time() * 1000)}-{secrets.token_hex(4)}",
        "username": clean,
        "discriminator": str(secrets.randbelow(9000) + 1000),
        "avatar": DEFAULT_AVATAR,
        "salt": salt_hex,
        "passwordHash": hash_password(password, salt_hex),
        "createdAt": int(time.time() * 1000),
    }
    db["accounts"].append(account)
    token = issue_token(db, account["id"])
    save_db(db)
    return jsonify(success=True, token=token, user=public_account(account))


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    clean = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    db = load_db()
    account = next((a for a in db["accounts"] if a["username"].lower() == clean.lower()), None)
    if not account:
        return jsonify(success=False, message="No account found with that username."), 401
    if not account.get("passwordHash"):
        return jsonify(success=False, message="This account uses Google sign-in."), 401
    if not hmac.compare_digest(hash_password(password, account["salt"]), account["passwordHash"]):
        return jsonify(success=False, message="Incorrect password."), 401

    token = issue_token(db, account["id"])
    save_db(db)
    return jsonify(success=True, token=token, user=public_account(account))


@app.post("/api/auth/google")
def google_auth():
    credential = (request.get_json(silent=True) or {}).get("credential")
    if not credential:
        return jsonify(success=False, message="Missing Google credential."), 400

    try:
        r = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
            timeout=10,
        )
        if r.status_code != 200:
            raise ValueError("tokeninfo rejected")
        payload = r.json()
    except Exception as e:
        return jsonify(success=False, message="Could not verify Google token.", detail=str(e)), 401

    if payload.get("aud") != GOOGLE_CLIENT_ID:
        return jsonify(success=False, message="Google token was issued for a different client."), 401

    db = load_db()
    account = next((a for a in db["accounts"] if a.get("googleSub") == payload.get("sub")), None)
    if not account:
        base = re.sub(r"[^A-Za-z0-9_.-]", "", (payload.get("name") or (payload.get("email", "user").split("@")[0]))[:24]) or "user"
        username = base
        n = 1
        while any(a["username"].lower() == username.lower() for a in db["accounts"]):
            username = f"{base}{n}"
            n += 1
        account = {
            "id": f"google-{payload.get('sub')}",
            "username": username,
            "discriminator": str(secrets.randbelow(9000) + 1000),
            "avatar": payload.get("picture", DEFAULT_AVATAR),
            "email": payload.get("email"),
            "googleSub": payload.get("sub"),
            "passwordHash": None,
            "createdAt": int(time.time() * 1000),
        }
        db["accounts"].append(account)

    token = issue_token(db, account["id"])
    save_db(db)
    return jsonify(success=True, token=token, user=public_account(account))


@app.get("/api/auth/me")
def me():
    db = load_db()
    account = account_for_token(db)
    if not account:
        return jsonify(success=False, message="Not signed in."), 401
    return jsonify(success=True, user=public_account(account))


@app.post("/api/auth/logout")
def logout():
    db = load_db()
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        db["sessions"].pop(token, None)
        save_db(db)
    return jsonify(success=True)


@app.get("/api/state")
def state_get():
    db = load_db()
    account = account_for_token(db)
    if not account:
        return jsonify(success=False, message="Not signed in."), 401
    return jsonify(success=True, state=db["states"].get(account["id"]))


@app.put("/api/state")
def state_put():
    db = load_db()
    account = account_for_token(db)
    if not account:
        return jsonify(success=False, message="Not signed in."), 401
    state = (request.get_json(silent=True) or {}).get("state")
    if not isinstance(state, dict):
        return jsonify(success=False, message="Body must be { state: object }."), 400
    if len(json.dumps(state)) > 2 * 1024 * 1024:
        return jsonify(success=False, message="State too large (max 2 MB)."), 413
    db["states"][account["id"]] = state
    save_db(db)
    return jsonify(success=True, savedAt=int(time.time() * 1000))


# ---------- music streaming via yt-dlp ----------
music_cache = {"url": None, "direct": None, "fetchedAt": 0}
_YT_RE = re.compile(r"^https?://(www\.|m\.)?(youtube\.com|youtu\.be)/", re.I)


@app.get("/api/music/stream")
def music_stream():
    track = request.args.get("track", MUSIC_TRACK)
    if not _YT_RE.match(track or ""):
        return jsonify(success=False, message="Only YouTube URLs allowed."), 400

    now = int(time.time())
    if music_cache["direct"] and music_cache["url"] == track and now - music_cache["fetchedAt"] < MUSIC_CACHE_TTL_S:
        return jsonify(success=True, url=music_cache["direct"], cached=True)

    try:
        out = subprocess.check_output(
            ["yt-dlp", "--no-playlist", "-f", "bestaudio/best", "--get-url", track],
            timeout=25,
            stderr=subprocess.STDOUT,
        ).decode("utf-8", errors="replace")
    except Exception as e:
        return jsonify(success=False, message="yt-dlp failed", detail=str(e)[:500]), 502

    lines = [l for l in out.splitlines() if l.strip()]
    if not lines:
        return jsonify(success=False, message="yt-dlp returned no URL"), 502
    direct = lines[-1].strip()
    music_cache.update(url=track, direct=direct, fetchedAt=now)
    return jsonify(success=True, url=direct)


# ---------- static (built web app) ----------
@app.get("/")
def index():
    if DIST_DIR.exists():
        return send_from_directory(DIST_DIR, "index.html")
    return "OpenChat V2 server is up. Run `npm run build` first."


@app.get("/<path:filename>")
def static_files(filename):
    if DIST_DIR.exists():
        candidate = DIST_DIR / filename
        if candidate.exists() and candidate.is_file():
            return send_from_directory(DIST_DIR, filename)
        return send_from_directory(DIST_DIR, "index.html")  # SPA fallback
    abort(404)


if __name__ == "__main__":
    print(f"✅ OpenChat V2 (Flask) on http://0.0.0.0:{PORT}")
    print(f"   accounts file: {ACCOUNTS_FILE}")
    app.run(host="0.0.0.0", port=PORT)

# PythonAnywhere WSGI entry point
application = app
