// Admiral Marine Services - Form M 21 Interview Sheet
// Run: node server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data.json');
const PUBLIC = path.join(__dirname, 'public');

const load = () => { try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { return []; } };
const save = (rows) => fs.writeFileSync(DATA, JSON.stringify(rows, null, 2));
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};
const readBody = (req) => new Promise((ok) => {
  let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { ok({}); } });
});

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const m = url.pathname.match(/^\/api\/interviews(?:\/([\w-]+))?$/);

  if (m) {
    const id = m[1];
    const rows = load();
    if (req.method === 'GET' && !id) return send(res, 200, rows);
    if (req.method === 'GET') {
      const r = rows.find((x) => x.id === id);
      return r ? send(res, 200, r) : send(res, 404, { error: 'Not found' });
    }
    if (req.method === 'POST' && !id) {
      const body = await readBody(req);
      const rec = { ...body, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
      rows.unshift(rec); save(rows);
      return send(res, 201, rec);
    }
    if (req.method === 'PUT' && id) {
      const i = rows.findIndex((x) => x.id === id);
      if (i < 0) return send(res, 404, { error: 'Not found' });
      rows[i] = { ...(await readBody(req)), id, updatedAt: new Date().toISOString() };
      save(rows);
      return send(res, 200, rows[i]);
    }
    if (req.method === 'DELETE' && id) {
      save(rows.filter((x) => x.id !== id));
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: 'Method not allowed' });
  }

  const file = path.join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
    return send(res, 404, 'Not found', 'text/plain');
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  send(res, 200, fs.readFileSync(file), types[path.extname(file)] || 'application/octet-stream');
}).listen(PORT, () => console.log(`M 21 Interview Sheet running at http://localhost:${PORT}`));
