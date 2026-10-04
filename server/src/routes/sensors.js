// Sensor readings captured in the browser (accelerometer step counts during exercise sessions).
import { Router } from 'express';
import { db } from '../db.js';
import { fail } from '../lib/errors.js';
import { id, isoDate, plainObject, today } from '../lib/validate.js';
import { findActivity } from '../models/activities.js';

const toApi = row => ({
  id: row.id,
  exerciseId: row.activity_id,
  sensor: row.sensor,
  metric: row.metric,
  value: row.value,
  durationSeconds: row.duration_seconds,
  day: row.day,
  recordedAt: row.recorded_at,
});

// Upper bound used to reject implausible data: about 4 steps per second (fast running).
const MAX_STEPS_PER_SECOND = 4;

export function sensorRoutes() {
  const router = Router();

  // GET /api/sensor-readings?from=YYYY-MM-DD&to=YYYY-MM-DD
  router.get('/', (req, res) => {
    const from = req.query.from ? isoDate(req.query.from) : '0000-01-01';
    const to = req.query.to ? isoDate(req.query.to) : '9999-12-31';
    const rows = db.prepare('SELECT * FROM sensor_readings WHERE user_id = ? AND day BETWEEN ? AND ? ORDER BY recorded_at, id').all(req.userId, from, to);
    res.json(rows.map(toApi));
  });

  // POST /api/sensor-readings { exerciseId, steps, durationSeconds, clientDay }
  router.post('/', (req, res) => {
    const body = plainObject(req.body);
    const exercise = findActivity(req.userId, 'exercise', id(body.exerciseId, 'exercise ID'));
    const durationSeconds = Number(body.durationSeconds);
    const steps = Number(body.steps);
    if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 86400) fail(400, 'durationSeconds must be a whole number from 1 to 86400.');
    if (!Number.isInteger(steps) || steps < 0 || steps > durationSeconds * MAX_STEPS_PER_SECOND) fail(400, 'Step count is not plausible for that duration.');
    const day = body.clientDay ? isoDate(body.clientDay) : today();
    const info = db.prepare(`INSERT INTO sensor_readings (user_id, activity_id, sensor, metric, value, duration_seconds, day)
      VALUES (?, ?, 'accelerometer', 'steps', ?, ?, ?)`).run(req.userId, exercise.id, steps, durationSeconds, day);
    const row = db.prepare('SELECT * FROM sensor_readings WHERE id = ?').get(Number(info.lastInsertRowid));
    res.status(201).json(toApi(row));
  });

  return router;
}
