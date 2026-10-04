// Daily wellness log: mood and water intake for one calendar day.
import { Router } from 'express';
import { db } from '../db.js';
import { fail } from '../lib/errors.js';
import { isoDate, mood, plainObject, MAX_WATER_CUPS } from '../lib/validate.js';
import { recordActivity } from '../models/activityDays.js';

export function wellnessFor(userId, day) {
  const row = db.prepare('SELECT mood, water_cups FROM wellness_logs WHERE user_id = ? AND day = ?').get(userId, day);
  return { day, mood: row?.mood ?? '', water: row?.water_cups ?? 0 };
}

export function wellnessRoutes() {
  const router = Router();

  router.get('/:day', (req, res) => res.json(wellnessFor(req.userId, isoDate(req.params.day))));

  // Partial update: send { mood } and/or { water } (absolute cups, 0–8).
  router.patch('/:day', (req, res) => {
    const day = isoDate(req.params.day);
    const body = plainObject(req.body);
    if (!('mood' in body) && !('water' in body)) fail(400, 'Send mood and/or water.');
    const current = wellnessFor(req.userId, day);
    const nextMood = 'mood' in body ? mood(body.mood) : current.mood;
    const nextWater = 'water' in body ? body.water : current.water;
    if (!Number.isInteger(nextWater) || nextWater < 0 || nextWater > MAX_WATER_CUPS) fail(400, `Water must be a whole number of cups from 0 to ${MAX_WATER_CUPS}.`);
    db.prepare(`INSERT INTO wellness_logs (user_id, day, mood, water_cups) VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, day) DO UPDATE SET mood = excluded.mood, water_cups = excluded.water_cups`).run(req.userId, day, nextMood, nextWater);
    recordActivity(req.userId, day);
    res.json(wellnessFor(req.userId, day));
  });

  return router;
}
