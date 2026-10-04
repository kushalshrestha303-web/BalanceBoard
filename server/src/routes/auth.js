// Registration, login, logout and Google OpenID Connect sign-in.
import { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { db, transaction } from '../db.js';
import { config } from '../config.js';
import { fail } from '../lib/errors.js';
import { requiredText } from '../lib/validate.js';
import { hashPassword, verifyPassword, validNewPassword } from '../lib/passwords.js';
import { startSession, endSession, requireAuth, readCookie } from '../middleware/auth.js';
import { challenge, verifyGoogleIdToken } from '../googleAuth.js';

const USERNAME = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]{2,39}$/;
const GOOGLE_FLOW_COOKIE = 'bb_google_flow';

export function authRoutes(authLimiter) {
  const router = Router();

  router.get('/providers', (_req, res) => res.json({ google: config.google.enabled }));

  router.post('/register', authLimiter, async (req, res) => {
    const username = requiredText(req.body?.username, 'Username', 40);
    if (!USERNAME.test(username)) fail(400, 'Username must be 3–40 letters, numbers, dots, underscores or hyphens.');
    if (!validNewPassword(req.body?.password)) fail(400, 'Password must be 12–128 characters.');
    if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) fail(409, 'Username already exists.');
    const { salt, hash } = await hashPassword(req.body.password);
    const id = Number(db.prepare('INSERT INTO users (username, salt, password_hash) VALUES (?, ?, ?)').run(username, salt, hash).lastInsertRowid);
    startSession(req, res, id);
    res.status(201).json({ user: { id, username } });
  });

  router.post('/login', authLimiter, async (req, res) => {
    const username = String(req.body?.username || '').slice(0, 100);
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length > 128) fail(401, 'Invalid username or password.');
    const user = db.prepare('SELECT id, username, salt, password_hash FROM users WHERE username = ?').get(username);
    if (!(await verifyPassword(password, user?.salt, user?.password_hash))) fail(401, 'Invalid username or password.');
    startSession(req, res, user.id);
    res.json({ user: { id: user.id, username: user.username } });
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.userId) });
  });

  router.post('/logout', requireAuth, (req, res) => {
    endSession(req, res);
    res.json({ ok: true });
  });

  // ---- Google sign-in (Authorization Code flow with PKCE, state and nonce) ----
  const secureFlag = config.appOrigin?.startsWith('https:') ? '; Secure' : '';
  const clearFlowCookie = res => res.setHeader('Set-Cookie', `${GOOGLE_FLOW_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age=0${secureFlag}`);
  const redirectUri = `${config.appOrigin}/api/auth/google/callback`;

  router.get('/google', (_req, res) => {
    if (!config.google.enabled) fail(503, 'Google sign-in needs APP_ORIGIN, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    const [state, nonce, verifier] = [0, 1, 2].map(() => randomBytes(32).toString('base64url'));
    res.setHeader('Set-Cookie', `${GOOGLE_FLOW_COOKIE}=${state}.${nonce}.${verifier}; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age=600${secureFlag}`);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const params = { client_id: config.google.clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email', state, nonce, code_challenge: challenge(verifier), code_challenge_method: 'S256' };
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    res.redirect(302, url.toString());
  });

  router.get('/google/callback', async (req, res) => {
    const [state, nonce, verifier] = readCookie(req, GOOGLE_FLOW_COOKIE)?.split('.') || [];
    clearFlowCookie(res);
    const failure = () => res.redirect(303, config.appOrigin ? `${config.appOrigin}/login?authError=google` : '/login?authError=google');
    const supplied = req.query.state;
    const wellFormed = [supplied, state, nonce, verifier].every(v => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v));
    if (!config.google.enabled || typeof req.query.code !== 'string' || !wellFormed || !timingSafeEqual(Buffer.from(supplied), Buffer.from(state))) return failure();
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code: req.query.code, client_id: config.google.clientId, client_secret: config.google.clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code', code_verifier: verifier }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('Google token exchange failed.');
      const identity = await verifyGoogleIdToken((await response.json()).id_token, config.google.clientId, nonce);
      const user = transaction(() => findOrCreateGoogleUser(identity));
      startSession(req, res, user.id);
      res.redirect(303, `${config.appOrigin}/dashboard`);
    } catch (error) {
      console.error('Google sign-in:', error);
      failure();
    }
  });

  return router;
}

function findOrCreateGoogleUser(identity) {
  const existing = db.prepare('SELECT u.id, u.username FROM users u JOIN google_identities g ON g.user_id = u.id WHERE g.google_sub = ?').get(identity.sub);
  if (existing) return existing;
  const base = identity.email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/^[^a-zA-Z0-9_]/, 'g').slice(0, 28) || 'google_user';
  let username = base.length >= 3 ? base : `google_${base}`;
  for (let n = 1; db.prepare('SELECT 1 FROM users WHERE username = ?').get(username); n++) username = `${base}_${n}`;
  // Google accounts get an unusable random password hash; they can only sign in through Google.
  const id = Number(db.prepare('INSERT INTO users (username, salt, password_hash) VALUES (?, ?, ?)')
    .run(username, randomBytes(16).toString('hex'), randomBytes(64).toString('hex')).lastInsertRowid);
  db.prepare('INSERT INTO google_identities (google_sub, user_id) VALUES (?, ?)').run(identity.sub, id);
  db.prepare('INSERT INTO profiles (user_id, display_name, email) VALUES (?, ?, ?)').run(id, identity.email.split('@')[0].slice(0, 80), identity.email);
  return { id, username };
}
