const crypto = require('crypto');

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(data));
}
function env(name) {
  const value = process.env[name];
  if (!value) throw new Error('Missing server environment variable: ' + name);
  return value;
}
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
function signed(value) {
  const body = Buffer.from(JSON.stringify(value)).toString('base64url');
  const mac = crypto.createHmac('sha256', env('APP_SECRET')).update(body).digest('base64url');
  return body + '.' + mac;
}
function unsign(value) {
  if (!value || !value.includes('.')) return null;
  const [body, mac] = value.split('.');
  const expected = crypto.createHmac('sha256', env('APP_SECRET')).update(body).digest();
  let actual;
  try { actual = Buffer.from(mac, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
}
async function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Error('Please sign in first.');
  const response = await fetch(env('SUPABASE_URL').replace(/\\/$/, '') + '/auth/v1/user', {
    headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('Your session is invalid or expired. Please sign in again.');
  return response.json();
}
async function db(path, options = {}) {
  const response = await fetch(env('SUPABASE_URL').replace(/\\/$/, '') + '/rest/v1/' + path, {
    method: options.method || 'GET',
    headers: {
      apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: 'Bearer ' + env('SUPABASE_SERVICE_ROLE_KEY'),
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  if (!response.ok) throw new Error('Database request failed: ' + text.slice(0, 300));
  return text ? JSON.parse(text) : [];
}
function encrypt(value) {
  const key = Buffer.from(env('TOKEN_ENCRYPTION_KEY'), 'hex');
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}
function decrypt(value) {
  const key = Buffer.from(env('TOKEN_ENCRYPTION_KEY'), 'hex');
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters.');
  const [iv, tag, data] = String(value).split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}
module.exports = { json, env, parseCookies, signed, unsign, requireUser, db, encrypt, decrypt };
