// Server-side focus timer. The server stores a deadline (not a ticking interval), so a running
// timer survives page reloads, multiple tabs and server restarts. "revision" rejects stale tabs.
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, transaction } from '../db.js';
import { fail } from '../lib/errors.js';
import { id, isoDate } from '../lib/validate.js';
import { findActivity, addProgress } from '../models/activities.js';
import { findSession } from '../models/sessions.js';
import { recordActivity } from '../models/activityDays.js';

const ACTIONS = ['start', 'pause', 'reset', 'save', 'discard'];
const getTimer = userId => db.prepare('SELECT * FROM focus_timers WHERE user_id = ?').get(userId);
const remainingAt = (timer, now) => Math.max(0, timer.remaining_ms - (timer.started_at == null ? 0 : Math.max(0, now - timer.started_at)));

function snapshot(userId) {
  const serverNow = Date.now();
  const timer = getTimer(userId);
  if (!timer) return { timer: null, serverNow };
  const item = findActivity(userId, timer.kind, timer.activity_id);
  const remainingMs = remainingAt(timer, serverNow);
  return {
    serverNow,
    timer: {
      id: timer.timer_id,
      revision: timer.revision,
      kind: timer.kind,
      itemId: timer.activity_id,
      calendarSessionId: timer.session_id,
      title: item.title,
      category: item.category,
      totalMs: timer.total_ms,
      remainingMs,
      deadline: timer.started_at == null ? null : timer.started_at + timer.remaining_ms,
      status: remainingMs === 0 ? 'finished' : timer.started_at == null ? 'paused' : 'running',
    },
  };
}

export function timerRoutes() {
  const router = Router();

  router.get('/', (req, res) => res.json(snapshot(req.userId)));

  // Select the activity (and optionally the calendar session) to time.
  router.put('/', (req, res) => {
    const { kind, itemId, calendarSessionId = null } = req.body || {};
    if (!['task', 'exercise'].includes(kind)) fail(400, 'Choose a study task or exercise.');
    const item = findActivity(req.userId, kind, id(itemId, 'item ID'));
    let sessionId = null;
    if (calendarSessionId != null) {
      const session = findSession(req.userId, id(calendarSessionId, 'calendar session ID'));
      if (session.activity_id !== item.id || session.type !== (kind === 'task' ? 'study' : 'exercise')) fail(400, 'Calendar session does not match this activity.');
      sessionId = session.id;
    }
    const current = getTimer(req.userId);
    if (current) {
      if (current.activity_id === item.id && current.session_id === sessionId) return res.json(snapshot(req.userId));
      fail(409, 'Save or discard the current timer before choosing another activity.');
    }
    const totalMs = Math.round(Math.max(0, item.target_minutes - item.completed_minutes) * 60000);
    if (item.completed || totalMs < 1000) fail(400, 'This activity is already complete.');
    db.prepare('INSERT INTO focus_timers (user_id, timer_id, activity_id, kind, session_id, total_ms, remaining_ms) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.userId, randomUUID(), item.id, kind, sessionId, totalMs, totalMs);
    res.json(snapshot(req.userId));
  });

  router.post('/actions', (req, res) => {
    const { action, timerId, revision, clientDay } = req.body || {};
    if (!ACTIONS.includes(action)) fail(400, 'Invalid timer action.');
    const day = action === 'save' ? isoDate(clientDay) : null;
    transaction(() => {
      const timer = getTimer(req.userId);
      const now = Date.now();
      if (!timer || timer.timer_id !== timerId || timer.revision !== revision) fail(409, 'Timer changed in another tab. The latest timer has been loaded.');
      const left = remainingAt(timer, now);
      if (action === 'discard') {
        db.prepare('DELETE FROM focus_timers WHERE user_id = ?').run(req.userId);
      } else if (action === 'save') {
        const elapsedMs = timer.total_ms - left;
        if (elapsedMs < 1000) fail(400, 'Run the timer for at least one second before saving progress.');
        addProgress(req.userId, timer.kind, timer.activity_id, elapsedMs / 60000);
        if (timer.session_id && left === 0) {
          db.prepare('UPDATE scheduled_sessions SET completed = 1 WHERE id = ? AND user_id = ? AND activity_id = ?').run(timer.session_id, req.userId, timer.activity_id);
        }
        recordActivity(req.userId, day);
        // Deleting the timer in the same transaction prevents double credit if the save is retried.
        db.prepare('DELETE FROM focus_timers WHERE user_id = ?').run(req.userId);
      } else if (action === 'reset') {
        db.prepare('UPDATE focus_timers SET remaining_ms = total_ms, started_at = NULL, revision = revision + 1 WHERE user_id = ?').run(req.userId);
      } else {
        if (action === 'start' && left === 0) fail(400, 'Timer finished. Save progress or reset it.');
        db.prepare('UPDATE focus_timers SET remaining_ms = ?, started_at = ?, revision = revision + 1 WHERE user_id = ?')
          .run(left, action === 'start' ? now : null, req.userId);
      }
    });
    res.json(snapshot(req.userId));
  });

  return router;
}
