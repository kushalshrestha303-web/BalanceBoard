// Profile details, alarm preferences and password changes.
import { Router } from 'express';
import { db } from '../db.js';
import { fail } from '../lib/errors.js';
import { hashPassword, verifyPassword, validNewPassword } from '../lib/passwords.js';
import { readCookie, hashToken, SESSION_COOKIE } from '../middleware/auth.js';

const REMINDER_OPTIONS = [0, 5, 10, 30];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function profileFor(userId) {
  const row = db.prepare(`SELECT u.username, u.created_at,
      COALESCE(p.display_name,'') AS display_name, COALESCE(p.email,'') AS email,
      COALESCE(p.alarm_enabled,1) AS alarm_enabled, COALESCE(p.alarm_sound,1) AS alarm_sound,
      COALESCE(p.alarm_vibrate,1) AS alarm_vibrate, COALESCE(p.alarm_desktop,1) AS alarm_desktop,
      COALESCE(p.reminder_minutes,30) AS reminder_minutes,
      EXISTS(SELECT 1 FROM google_identities g WHERE g.user_id = u.id) AS google_account
    FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?`).get(userId);
  return {
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    createdAt: row.created_at,
    provider: row.google_account ? 'Google' : 'Password',
    alarm: {
      enabled: Boolean(row.alarm_enabled),
      sound: Boolean(row.alarm_sound),
      vibrate: Boolean(row.alarm_vibrate),
      desktop: Boolean(row.alarm_desktop),
      reminderMinutes: row.reminder_minutes,
    },
  };
}

function validateProfile(body) {
  const { displayName, email, alarm } = body || {};
  const valid = typeof displayName === 'string' && displayName.length <= 80
    && typeof email === 'string' && email.length <= 254 && (!email.trim() || EMAIL.test(email.trim()))
    && alarm && typeof alarm === 'object' && !Array.isArray(alarm)
    && ['enabled', 'sound', 'vibrate', 'desktop'].every(key => typeof alarm[key] === 'boolean')
    && REMINDER_OPTIONS.includes(alarm.reminderMinutes);
  if (!valid) fail(400, 'Invalid profile or alarm settings.');
  return { displayName: displayName.trim(), email: email.trim(), alarm };
}

export function profileRoutes(authLimiter) {
  const router = Router();

  router.get('/', (req, res) => res.json(profileFor(req.userId)));

  router.patch('/', (req, res) => {
    const { displayName, email, alarm } = validateProfile(req.body);
    db.prepare('INSERT OR IGNORE INTO profiles (user_id) VALUES (?)').run(req.userId);
    db.prepare(`UPDATE profiles SET display_name = ?, email = ?, alarm_enabled = ?, alarm_sound = ?, alarm_vibrate = ?, alarm_desktop = ?, reminder_minutes = ?
      WHERE user_id = ?`).run(displayName, email, Number(alarm.enabled), Number(alarm.sound), Number(alarm.vibrate), Number(alarm.desktop), alarm.reminderMinutes, req.userId);
    res.json(profileFor(req.userId));
  });

  router.patch('/password', authLimiter, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || currentPassword.length > 128 || !validNewPassword(newPassword)) fail(400, 'New password must be 12–128 characters.');
    if (db.prepare('SELECT 1 FROM google_identities WHERE user_id = ?').get(req.userId)) fail(400, 'Google accounts do not have a local password.');
    const user = db.prepare('SELECT salt, password_hash FROM users WHERE id = ?').get(req.userId);
    if (!(await verifyPassword(currentPassword, user.salt, user.password_hash))) fail(401, 'Current password is incorrect.');
    const { salt, hash } = await hashPassword(newPassword);
    // The WHERE on the old hash stops two concurrent password changes from both succeeding.
    const changed = db.prepare('UPDATE users SET salt = ?, password_hash = ? WHERE id = ? AND password_hash = ?').run(salt, hash, req.userId, user.password_hash);
    if (!changed.changes) fail(409, 'Password changed in another request. Please sign in again.');
    // Sign out every other device.
    db.prepare('DELETE FROM auth_sessions WHERE user_id = ? AND token_hash <> ?').run(req.userId, hashToken(readCookie(req, SESSION_COOKIE)));
    res.json({ ok: true });
  });

  return router;
}
