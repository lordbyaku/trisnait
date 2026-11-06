// Portfolio CMS — zero-dependency Node.js server (http + fs + crypto only)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DEFAULT_FILE = path.join(DATA_DIR, 'content.default.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ADMIN_DIR = path.join(ROOT, 'admin');

const MAX_BODY = 25 * 1024 * 1024; // 25 MB (base64 upload overhead included)
const MAX_BACKUPS = 30;
const SESSION_TTL = 1000 * 60 * 60 * 12; // 12 jam
const ALLOWED_UPLOAD = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.glb', '.gltf', '.pdf', '.mp4', '.webm'];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

// ---------- bootstrap ----------
for (const d of [DATA_DIR, BACKUP_DIR, UPLOAD_DIR]) fs.mkdirSync(d, { recursive: true });
if (!fs.existsSync(CONTENT_FILE)) fs.copyFileSync(DEFAULT_FILE, CONTENT_FILE);

function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') };
}
if (!fs.existsSync(AUTH_FILE)) {
  const initial = process.env.ADMIN_PASSWORD || 'admin123';
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ ...hashPassword(initial), isDefault: !process.env.ADMIN_PASSWORD }, null, 2));
}
const readAuth = () => JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
function checkPassword(pw) {
  const { salt, hash } = readAuth();
  const test = crypto.scryptSync(String(pw), salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

// ---------- sessions ----------
const sessions = new Map(); // token -> expiry
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function isAuthed(req) {
  const t = parseCookies(req).pcms;
  if (!t || !sessions.has(t)) return false;
  if (sessions.get(t) < Date.now()) { sessions.delete(t); return false; }
  sessions.set(t, Date.now() + SESSION_TTL);
  return true;
}

// simple login rate limit
const attempts = new Map(); // ip -> {count, until}
function limited(ip) {
  const a = attempts.get(ip);
  return a && a.until > Date.now() && a.count >= 5;
}
function failAttempt(ip) {
  const a = attempts.get(ip) || { count: 0, until: 0 };
  if (a.until < Date.now()) { a.count = 0; }
  a.count++; a.until = Date.now() + 5 * 60 * 1000;
  attempts.set(ip, a);
}

// ---------- helpers ----------
function send(res, status, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'Content-Type': isObj ? MIME['.json'] : 'text/plain; charset=utf-8', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Payload terlalu besar'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(Object.assign(new Error('JSON tidak valid'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
function backupContent() {
  if (!fs.existsSync(CONTENT_FILE)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(CONTENT_FILE, path.join(BACKUP_DIR, `content-${stamp}.json`));
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort();
  while (files.length > MAX_BACKUPS) fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
}
function writeContent(obj) {
  backupContent();
  const tmp = CONTENT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, CONTENT_FILE);
}
function safeName(name) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, path.extname(name)).toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'file';
  return { base, ext };
}
function serveStatic(res, baseDir, rel) {
  const target = path.normalize(path.join(baseDir, rel));
  if (!target.startsWith(baseDir)) return send(res, 403, 'Forbidden');
  fs.stat(target, (err, st) => {
    if (err) return send(res, 404, 'Not found');
    const file = st.isDirectory() ? path.join(target, 'index.html') : target;
    fs.readFile(file, (e, buf) => {
      if (e) return send(res, 404, 'Not found');
      const ext = path.extname(file).toLowerCase();
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
      if (ext === '.html') headers['Cache-Control'] = 'no-cache';
      res.writeHead(200, headers);
      res.end(buf);
    });
  });
}

// ---------- API ----------
async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const ip = req.socket.remoteAddress;

  if (route === 'GET /api/content') {
    return send(res, 200, fs.readFileSync(CONTENT_FILE, 'utf8'), { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  }
  if (route === 'POST /api/login') {
    if (limited(ip)) return send(res, 429, { error: 'Terlalu banyak percobaan. Coba lagi 5 menit lagi.' });
    const { password } = await readBody(req);
    if (!password || !checkPassword(password)) { failAttempt(ip); return send(res, 401, { error: 'Password salah' }); }
    attempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL);
    return send(res, 200, { ok: true, isDefault: !!readAuth().isDefault },
      { 'Set-Cookie': `pcms=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}` });
  }
  if (route === 'POST /api/logout') {
    sessions.delete(parseCookies(req).pcms);
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'pcms=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }
  if (route === 'GET /api/me') {
    return send(res, 200, { authed: isAuthed(req), isDefault: isAuthed(req) ? !!readAuth().isDefault : undefined });
  }

  // --- everything below requires login ---
  if (!isAuthed(req)) return send(res, 401, { error: 'Belum login' });

  if (route === 'PUT /api/content') {
    const body = await readBody(req);
    if (!body || typeof body !== 'object' || Array.isArray(body) || !body.site) return send(res, 400, { error: 'Struktur konten tidak valid' });
    writeContent(body);
    return send(res, 200, { ok: true, savedAt: new Date().toISOString() });
  }
  if (route === 'POST /api/content/reset') {
    writeContent(JSON.parse(fs.readFileSync(DEFAULT_FILE, 'utf8')));
    return send(res, 200, { ok: true });
  }
  if (route === 'GET /api/backups') {
    const list = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort().reverse()
      .map(f => ({ name: f, size: fs.statSync(path.join(BACKUP_DIR, f)).size }));
    return send(res, 200, list);
  }
  if (route === 'POST /api/backups/restore') {
    const { name } = await readBody(req);
    const file = path.join(BACKUP_DIR, path.basename(String(name || '')));
    if (!fs.existsSync(file)) return send(res, 404, { error: 'Backup tidak ditemukan' });
    writeContent(JSON.parse(fs.readFileSync(file, 'utf8')));
    return send(res, 200, { ok: true });
  }
  if (route === 'POST /api/upload') {
    const { name, data } = await readBody(req);
    if (!name || !data) return send(res, 400, { error: 'name & data wajib' });
    const { base, ext } = safeName(name);
    if (!ALLOWED_UPLOAD.includes(ext)) return send(res, 400, { error: `Tipe file ${ext} tidak diizinkan` });
    const b64 = String(data).replace(/^data:[^;]*;base64,/, '');
    const file = `${base}-${Date.now().toString(36)}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, file), Buffer.from(b64, 'base64'));
    return send(res, 200, { url: `/uploads/${file}` });
  }
  if (route === 'GET /api/uploads') {
    const list = fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.'))
      .map(f => { const st = fs.statSync(path.join(UPLOAD_DIR, f)); return { name: f, url: `/uploads/${f}`, size: st.size, mtime: st.mtimeMs }; })
      .sort((a, b) => b.mtime - a.mtime);
    return send(res, 200, list);
  }
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/uploads/')) {
    const file = path.join(UPLOAD_DIR, path.basename(decodeURIComponent(url.pathname.slice('/api/uploads/'.length))));
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return send(res, 200, { ok: true });
  }
  if (route === 'POST /api/password') {
    const { current, next } = await readBody(req);
    if (!checkPassword(current || '')) return send(res, 400, { error: 'Password lama salah' });
    if (!next || String(next).length < 6) return send(res, 400, { error: 'Password baru minimal 6 karakter' });
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ ...hashPassword(next), isDefault: false }, null, 2));
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'Endpoint tidak ada' });
}

// ---------- router ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname === '/admin') { res.writeHead(301, { Location: '/admin/' }); return res.end(); }
    if (url.pathname.startsWith('/admin/')) return serveStatic(res, ADMIN_DIR, decodeURIComponent(url.pathname.slice(7)));
    if (url.pathname.startsWith('/uploads/')) return serveStatic(res, UPLOAD_DIR, decodeURIComponent(url.pathname.slice(9)));
    return serveStatic(res, PUBLIC_DIR, decodeURIComponent(url.pathname));
  } catch (e) {
    send(res, e.status || 500, { error: e.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Portfolio : http://localhost:${PORT}`);
  console.log(`  Dashboard : http://localhost:${PORT}/admin`);
  if (readAuth().isDefault) console.log('  Password default: admin123  (segera ganti di menu Akun)\n');
});
