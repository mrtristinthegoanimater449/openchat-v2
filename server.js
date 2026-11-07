import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ACCOUNTS_FILE = process.env.ACCOUNTS_FILE || path.join(__dirname, 'accounts.json');
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '520658917291-nehsp0uaeau7vfevpuopea9n4ee2ssco.apps.googleusercontent.com';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

// ---------- tiny JSON "database" ----------
function loadDb() {
  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    const db = JSON.parse(raw);
    return { accounts: db.accounts ?? [], sessions: db.sessions ?? {}, states: db.states ?? {} };
  } catch {
    return { accounts: [], sessions: {}, states: {} };
  }
}
function saveDb(db) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(db, null, 2));
}
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
function publicAccount(a) {
  return {
    id: a.id,
    username: a.username,
    discriminator: a.discriminator,
    avatar: a.avatar,
    email: a.email,
    createdAt: a.createdAt,
  };
}
function issueToken(db, accountId) {
  const token = crypto.randomBytes(48).toString('hex');
  db.sessions[token] = accountId;
  return token;
}
function accountForToken(db, req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const id = db.sessions[token];
  if (!id) return null;
  return db.accounts.find((a) => a.id === id) || null;
}

const app = express();
app.use(express.json({ limit: '32kb' }));

// ---------- API ----------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body ?? {};
  const clean = String(username ?? '').trim();
  if (clean.length < 2 || clean.length > 32)
    return res.status(400).json({ success: false, message: 'Username must be 2–32 characters.' });
  if (!/^[a-zA-Z0-9_.-]+$/.test(clean))
    return res.status(400).json({ success: false, message: 'Username: letters, numbers, dots, dashes, underscores only.' });
  if (String(password ?? '').length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

  const db = loadDb();
  if (db.accounts.some((a) => a.username.toLowerCase() === clean.toLowerCase()))
    return res.status(409).json({ success: false, message: 'That username is already taken.' });

  const salt = crypto.randomBytes(16).toString('hex');
  const account = {
    id: `acct-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    username: clean,
    discriminator: String(Math.floor(1000 + Math.random() * 9000)),
    avatar: DEFAULT_AVATAR,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: Date.now(),
  };
  db.accounts.push(account);
  const token = issueToken(db, account.id);
  saveDb(db);
  res.json({ success: true, token, user: publicAccount(account) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const clean = String(username ?? '').trim();
  const db = loadDb();
  const account = db.accounts.find((a) => a.username.toLowerCase() === clean.toLowerCase());
  if (!account) return res.status(401).json({ success: false, message: 'No account found with that username.' });
  if (!account.passwordHash)
    return res.status(401).json({ success: false, message: 'This account uses Google sign-in.' });
  if (hashPassword(password, account.salt) !== account.passwordHash)
    return res.status(401).json({ success: false, message: 'Incorrect password.' });

  const token = issueToken(db, account.id);
  saveDb(db);
  res.json({ success: true, token, user: publicAccount(account) });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body ?? {};
  if (!credential) return res.status(400).json({ success: false, message: 'Missing Google credential.' });

  // Verify the ID token with Google
  let payload;
  try {
    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!r.ok) throw new Error('tokeninfo failed');
    payload = await r.json();
  } catch {
    return res.status(401).json({ success: false, message: 'Could not verify Google token.' });
  }
  if (payload.aud !== GOOGLE_CLIENT_ID)
    return res.status(401).json({ success: false, message: 'Google token was issued for a different client.' });

  const db = loadDb();
  let account = db.accounts.find((a) => a.googleSub === payload.sub);
  if (!account) {
    const base =
      (payload.name || payload.email?.split('@')[0] || 'user')
        .replace(/[^a-zA-Z0-9_.-]/g, '')
        .slice(0, 24) || 'user';
    let username = base;
    let n = 1;
    while (db.accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
      username = `${base}${n++}`;
    }
    account = {
      id: `google-${payload.sub}`,
      username,
      discriminator: String(Math.floor(1000 + Math.random() * 9000)),
      avatar: payload.picture || DEFAULT_AVATAR,
      email: payload.email,
      googleSub: payload.sub,
      passwordHash: null,
      createdAt: Date.now(),
    };
    db.accounts.push(account);
  }
  const token = issueToken(db, account.id);
  saveDb(db);
  res.json({ success: true, token, user: publicAccount(account) });
});

app.get('/api/auth/me', (req, res) => {
  const db = loadDb();
  const account = accountForToken(db, req);
  if (!account) return res.status(401).json({ success: false, message: 'Not signed in.' });
  res.json({ success: true, user: publicAccount(account) });
});

app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    const db = loadDb();
    if (db.sessions[token]) {
      delete db.sessions[token];
      saveDb(db);
    }
  }
  res.json({ success: true });
});

// ---------- app state sync (servers/channels/messages/friends) ----------
app.get('/api/state', (req, res) => {
  const db = loadDb();
  const account = accountForToken(db, req);
  if (!account) return res.status(401).json({ success: false, message: 'Not signed in.' });
  res.json({ success: true, state: db.states[account.id] ?? null });
});

app.put('/api/state', (req, res) => {
  const db = loadDb();
  const account = accountForToken(db, req);
  if (!account) return res.status(401).json({ success: false, message: 'Not signed in.' });
  const state = req.body?.state;
  if (state == null || typeof state !== 'object' || Array.isArray(state))
    return res.status(400).json({ success: false, message: 'Body must be { state: object }.' });
  // Keep the blob reasonable: 2 MB cap
  const size = JSON.stringify(state).length;
  if (size > 2 * 1024 * 1024)
    return res.status(413).json({ success: false, message: 'State too large (max 2 MB).' });
  db.states[account.id] = state;
  saveDb(db);
  res.json({ success: true, savedAt: Date.now() });
});

// ---------- static frontend ----------
const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ OpenChat V2 serving on http://0.0.0.0:${PORT}`);
  console.log(`   accounts file: ${ACCOUNTS_FILE}`);
});
