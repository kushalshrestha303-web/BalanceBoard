// Data access for study tasks and exercises (both stored in the "activities" table).
import { db } from '../db.js';
import { fail } from '../lib/errors.js';

// API field names differ by kind so the React components can stay unchanged.
export const FIELDS = {
  task: { target: 'focusMinutes', done: 'completedFocusMinutes', defaultCategory: 'Study', defaultMinutes: 25, label: 'Task' },
  exercise: { target: 'exerciseMinutes', done: 'completedExerciseMinutes', defaultCategory: 'Exercise', defaultMinutes: 30, label: 'Exercise' },
};

export function toApi(row) {
  const f = FIELDS[row.kind];
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    [f.target]: row.target_minutes,
    [f.done]: row.completed_minutes,
    completed: Boolean(row.completed),
    createdFromCalendar: Boolean(row.from_calendar),
    ...(row.kind === 'exercise' ? { steps: row.steps ?? 0 } : {}),
    createdAt: row.created_at,
  };
}

const SELECT = `SELECT a.*, (SELECT COALESCE(SUM(value),0) FROM sensor_readings r WHERE r.activity_id = a.id AND r.metric = 'steps') AS steps
  FROM activities a`;

export function listActivities(userId, kind) {
  return db.prepare(`${SELECT} WHERE a.user_id = ? AND a.kind = ? ORDER BY a.id`).all(userId, kind);
}

// Returns the row only if it belongs to the user; otherwise 404 (never reveal other users' IDs).
export function findActivity(userId, kind, id) {
  const row = db.prepare(`${SELECT} WHERE a.id = ? AND a.user_id = ? AND a.kind = ?`).get(id, userId, kind);
  if (!row) fail(404, `${FIELDS[kind].label} not found.`);
  return row;
}

export function createActivity(userId, kind, { title, category, description, targetMinutes, fromCalendar = false }) {
  const info = db.prepare(`INSERT INTO activities (user_id, kind, title, category, description, target_minutes, from_calendar)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, kind, title, category, description, targetMinutes, Number(fromCalendar));
  return findActivity(userId, kind, Number(info.lastInsertRowid));
}

export function updateActivity(userId, kind, id, changes) {
  const row = findActivity(userId, kind, id);
  const next = {
    title: changes.title ?? row.title,
    category: changes.category ?? row.category,
    description: changes.description ?? row.description,
    target_minutes: changes.targetMinutes ?? row.target_minutes,
    completed: changes.completed ?? Boolean(row.completed),
  };
  // Shrinking the target below the time already logged caps the logged time.
  const completedMinutes = Math.min(row.completed_minutes, next.target_minutes);
  db.prepare(`UPDATE activities SET title = ?, category = ?, description = ?, target_minutes = ?, completed_minutes = ?, completed = ?
    WHERE id = ? AND user_id = ?`).run(next.title, next.category, next.description, next.target_minutes, completedMinutes, Number(next.completed), id, userId);
  return findActivity(userId, kind, id);
}

export function addProgress(userId, kind, id, minutesDone) {
  const row = findActivity(userId, kind, id);
  const total = Math.min(row.target_minutes, Math.round((row.completed_minutes + minutesDone) * 1000) / 1000);
  db.prepare('UPDATE activities SET completed_minutes = ?, completed = ? WHERE id = ? AND user_id = ?')
    .run(total, Number(total >= row.target_minutes || Boolean(row.completed)), id, userId);
  return findActivity(userId, kind, id);
}

export function deleteActivity(userId, kind, id) {
  findActivity(userId, kind, id);
  db.prepare('DELETE FROM activities WHERE id = ? AND user_id = ?').run(id, userId);
}
