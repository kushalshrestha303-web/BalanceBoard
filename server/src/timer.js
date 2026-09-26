import { randomUUID } from 'node:crypto';

// Deadlines, not process-local intervals, preserve timers across restarts.
export function registerTimerRoutes(app, { db, row, update, record, fail, date }) {
  db.exec(`CREATE TABLE IF NOT EXISTS focus_timers (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    timer_id TEXT NOT NULL, item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK(kind IN ('task','exercise')),
    calendar_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    total_ms INTEGER NOT NULL, remaining_ms INTEGER NOT NULL,
    started_at INTEGER, revision INTEGER NOT NULL DEFAULT 1
  )`);
  const get = userId => db.prepare('SELECT * FROM focus_timers WHERE user_id=?').get(userId);
  const remaining = (timer, now) => Math.max(0, timer.remaining_ms - (timer.started_at == null ? 0 : Math.max(0, now - timer.started_at)));
  function snapshot(userId) {
    const serverNow = Date.now(), timer = get(userId);
    if (!timer) return { timer: null, serverNow };
    const item = row(userId, timer.kind, timer.item_id);
    const remainingMs = remaining(timer, serverNow);
    return { serverNow, timer: {
      id: timer.timer_id, revision: timer.revision, kind: timer.kind, itemId: timer.item_id,
      calendarSessionId: timer.calendar_id, title: item.title, category: item.category,
      totalMs: timer.total_ms, remainingMs,
      deadline: timer.started_at == null ? null : timer.started_at + timer.remaining_ms,
      status: remainingMs === 0 ? 'finished' : timer.started_at == null ? 'paused' : 'running'
    } };
  }
  app.get('/api/timer', (req, res) => res.json(snapshot(req.userId)));
  app.put('/api/timer', (req, res, next) => { try {
    const { kind, itemId, calendarSessionId = null } = req.body || {};
    if (!['task', 'exercise'].includes(kind)) fail(400, 'Choose a study task or exercise.');
    const item = row(req.userId, kind, itemId);
    let calendarId = null;
    if (calendarSessionId != null) {
      const session = row(req.userId, 'session', calendarSessionId);
      if (session.linkedItemId !== item.id || session.type !== (kind === 'task' ? 'study' : 'exercise')) fail(400, 'Calendar session does not match this activity.');
      calendarId = session.id;
    }
    const current = get(req.userId);
    if (current) {
      if (current.item_id === item.id && current.calendar_id === calendarId) return res.json(snapshot(req.userId));
      fail(409, 'Save or discard the current timer before choosing another activity.');
    }
    const target = kind === 'task' ? 'focusMinutes' : 'exerciseMinutes';
    const completed = kind === 'task' ? 'completedFocusMinutes' : 'completedExerciseMinutes';
    const totalMs = Math.round(Math.max(0, item[target] - (item[completed] || 0)) * 60000);
    if (item.completed || totalMs < 1000) fail(400, 'This activity is already complete.');
    db.prepare('INSERT INTO focus_timers(user_id,timer_id,item_id,kind,calendar_id,total_ms,remaining_ms) VALUES(?,?,?,?,?,?,?)')
      .run(req.userId, randomUUID(), item.id, kind, calendarId, totalMs, totalMs);
    res.json(snapshot(req.userId));
  } catch (e) { next(e); } });
  app.post('/api/timer/actions', (req, res, next) => { try {
    const { action, timerId, revision, clientDay } = req.body || {};
    if (!['start', 'pause', 'reset', 'save', 'discard'].includes(action)) fail(400, 'Invalid timer action.');
    const day = action === 'save' ? date(clientDay) : null;
    db.exec('BEGIN IMMEDIATE');
    try {
      const timer = get(req.userId), now = Date.now();
      if (!timer || timer.timer_id !== timerId || timer.revision !== revision) fail(409, 'Timer changed in another tab. The latest timer has been loaded.');
      const left = remaining(timer, now);
      if (action === 'discard') db.prepare('DELETE FROM focus_timers WHERE user_id=?').run(req.userId);
      else if (action === 'save') {
        const elapsedMs = timer.total_ms - left;
        if (elapsedMs < 1000) fail(400, 'Run the timer for at least one second before saving progress.');
        const item = row(req.userId, timer.kind, timer.item_id);
        const key = timer.kind === 'task' ? 'completedFocusMinutes' : 'completedExerciseMinutes';
        const target = timer.kind === 'task' ? 'focusMinutes' : 'exerciseMinutes';
        item[key] = Math.min(item[target], Math.round(((item[key] || 0) + elapsedMs / 60000) * 1000) / 1000);
        item.completed = item[key] >= item[target];
        const { id, ...data } = item;
        update(req.userId, timer.kind, id, data);
        if (timer.calendar_id && left === 0) {
          const session = row(req.userId, 'session', timer.calendar_id);
          const { id: sessionId, ...sessionData } = session;
          if (session.linkedItemId === item.id && session.type === (timer.kind === 'task' ? 'study' : 'exercise')) {
            update(req.userId, 'session', sessionId, { ...sessionData, completed: true });
          }
        }
        record(req.userId, day);
        // Removing the timer in the same transaction prevents duplicate credit on retry.
        db.prepare('DELETE FROM focus_timers WHERE user_id=?').run(req.userId);
      } else if (action === 'reset') {
        db.prepare('UPDATE focus_timers SET remaining_ms=total_ms,started_at=NULL,revision=revision+1 WHERE user_id=?').run(req.userId);
      } else {
        if (action === 'start' && left === 0) fail(400, 'Timer finished. Save progress or reset it.');
        db.prepare('UPDATE focus_timers SET remaining_ms=?,started_at=?,revision=revision+1 WHERE user_id=?')
          .run(left, action === 'start' ? now : null, req.userId);
      }
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    res.json(snapshot(req.userId));
  } catch (e) { next(e); } });
}
