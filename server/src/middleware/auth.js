// Cookie-based sessions: a random token is sent to the browser (HttpOnly) and only its SHA-256 hash is stored.
import { randomBytes, createHash } from 'node:crypto';
import { db } from '../db.js';
import { config } from '../config.js';

export const SESSION_COOKIE = 'bb_session';
export const hashToken = value => createHash('sha256').update(value).digest('hex');

export function readCookie(req, name) {
  return (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

const isSecure = req => req.secure || req.get('x-forwarded-proto') === 'https' || Boolean(config.appOrigin?.startsWith('https:'));

export function startSession(req, res, userId) {
  const token = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), userId, Date.now() + config.sessionTtlMs);
  res.append('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${config.sessionTtlMs / 1000}${isSecure(req) ? '; Secure' : ''}`);
}

export function endSession(req, res) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

// Rejects requests without a valid session; otherwise sets req.userId for the route handlers.
export function requireAuth(req, res, next) {
  const token = readCookie(req, SESSION_COOKIE);
  const session = token && db.prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > ?').get(hashToken(token), Date.now());
  if (!session) return res.status(401).json({ error: 'Your session expired. Sign in to continue.', code: 'SESSION_EXPIRED' });
  req.userId = session.user_id;
  next();
}
