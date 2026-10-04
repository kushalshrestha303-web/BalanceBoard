// Data access for calendar (scheduled) study and exercise sessions.
import { db } from '../db.js';
import { fail } from '../lib/errors.js';

export const kindForType = type => (type === 'exercise' ? 'exercise' : 'task');

export function toApi(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    date: row.day,
    startTime: row.start_time,
    duration: row.duration_minutes,
    linkedItemId: row.activity_id,
    completed: Boolean(row.completed),
  };
}

export function listSessions(userId) {
  return db.prepare('SELECT * FROM scheduled_sessions WHERE user_id = ? ORDER BY day, start_time, id').all(userId);
}

export function findSession(userId, id) {
  const row = db.prepare('SELECT * FROM scheduled_sessions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) fail(404, 'Session not found.');
  return row;
}

export function insertSession(userId, s) {
  const info = db.prepare(`INSERT INTO scheduled_sessions (user_id, activity_id, type, title, day, start_time, duration_minutes, completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(userId, s.activityId, s.type, s.title, s.date, s.startTime, s.duration, Number(s.completed));
  return findSession(userId, Number(info.lastInsertRowid));
}

export function saveSession(userId, id, s) {
  db.prepare(`UPDATE scheduled_sessions SET activity_id = ?, type = ?, title = ?, day = ?, start_time = ?, duration_minutes = ?, completed = ?
    WHERE id = ? AND user_id = ?`).run(s.activityId, s.type, s.title, s.date, s.startTime, s.duration, Number(s.completed), id, userId);
  return findSession(userId, id);
}

export function deleteSession(userId, id) {
  findSession(userId, id);
  db.prepare('DELETE FROM scheduled_sessions WHERE id = ? AND user_id = ?').run(id, userId);
}
