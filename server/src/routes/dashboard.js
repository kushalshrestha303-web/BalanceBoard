// Read-only aggregate endpoints: the dashboard summary and due calendar alarms.
import { Router } from 'express';
import { db } from '../db.js';
import { isoDate, clockTime, today } from '../lib/validate.js';
import { listActivities, toApi as activityToApi } from '../models/activities.js';
import { listSessions, toApi as sessionToApi } from '../models/sessions.js';
import { streakFor } from '../models/activityDays.js';
import { wellnessFor } from './wellness.js';
import { profileFor } from './profile.js';

const toMinutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export function dashboardRoutes() {
  const router = Router();

  // One request returns everything the dashboard needs, avoiding several round trips.
  router.get('/dashboard', (req, res) => {
    const day = isoDate(req.query.day || today());
    res.json({
      tasks: listActivities(req.userId, 'task').map(activityToApi),
      exercises: listActivities(req.userId, 'exercise').map(activityToApi),
      scheduledSessions: listSessions(req.userId).map(sessionToApi),
      wellness: wellnessFor(req.userId, day),
      streak: streakFor(req.userId, day),
    });
  });

  // Sessions starting in the last 2 minutes of the client's local time (the client polls every 15 s).
  router.get('/alarms/due', (req, res) => {
    const day = isoDate(req.query.day);
    const now = toMinutes(clockTime(req.query.time));
    const settings = profileFor(req.userId).alarm;
    if (!settings.enabled) return res.json({ alarms: [], settings });
    const alarms = db.prepare('SELECT * FROM scheduled_sessions WHERE user_id = ? AND day = ? AND completed = 0').all(req.userId, day)
      .filter(s => now - toMinutes(s.start_time) >= 0 && now - toMinutes(s.start_time) < 2)
      .map(sessionToApi)
      .map(({ id, title, date, startTime, type }) => ({ id, title, date, startTime, type }));
    res.json({ alarms, settings });
  });

  return router;
}
