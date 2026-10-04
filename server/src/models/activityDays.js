// Records the days a user was active; the dashboard derives the streak from these.
import { db } from '../db.js';
import { isoDate, today } from '../lib/validate.js';

export function recordActivity(userId, day) {
  db.prepare('INSERT OR IGNORE INTO activity_days (user_id, day) VALUES (?, ?)').run(userId, isoDate(day || today()));
}

export function streakFor(userId, day) {
  const days = new Set(db.prepare('SELECT day FROM activity_days WHERE user_id = ?').all(userId).map(r => r.day));
  const cursor = new Date(`${day}T12:00:00Z`);
  if (!days.has(day)) cursor.setUTCDate(cursor.getUTCDate() - 1); // today not logged yet: count up to yesterday
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
