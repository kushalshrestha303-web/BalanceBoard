// REST resource for calendar sessions (/api/sessions). Each session can link to a task or exercise.
import { Router } from 'express';
import { transaction } from '../db.js';
import { fail } from '../lib/errors.js';
import { requiredText, minutes, id, isoDate, clockTime, boolean, plainObject } from '../lib/validate.js';
import { findActivity, createActivity, updateActivity } from '../models/activities.js';
import { kindForType, toApi, listSessions, findSession, insertSession, saveSession, deleteSession } from '../models/sessions.js';
import { recordActivity } from '../models/activityDays.js';

const sessionType = value => (value === 'study' || value === 'exercise' ? value : fail(400, 'Session type must be "study" or "exercise".'));

// Confirms the linked task/exercise exists, belongs to this user and matches the session type.
function linkedActivityId(userId, type, value) {
  if (value == null || value === '') return null;
  return findActivity(userId, kindForType(type), id(value, 'linked item ID')).id;
}

export function sessionRoutes() {
  const router = Router();

  router.get('/', (req, res) => res.json(listSessions(req.userId).map(toApi)));

  router.get('/:id', (req, res) => res.json(toApi(findSession(req.userId, id(req.params.id)))));

  // Creating a session without a linked item also creates the matching task/exercise,
  // so the scheduled time shows up on the dashboard and can be tracked with the focus timer.
  router.post('/', (req, res) => {
    const body = plainObject(req.body);
    const session = {
      type: sessionType(body.type),
      title: requiredText(body.title, 'Title'),
      date: isoDate(body.date),
      startTime: clockTime(body.startTime),
      duration: minutes(body.duration, 'Duration'),
      completed: body.completed == null ? false : boolean(body.completed, 'completed'),
    };
    const created = transaction(() => {
      let activityId = linkedActivityId(req.userId, session.type, body.linkedItemId);
      if (!activityId) {
        const kind = kindForType(session.type);
        activityId = createActivity(req.userId, kind, {
          title: session.title,
          category: kind === 'task' ? 'Study' : 'Exercise',
          description: 'Scheduled from BalanceBoard Calendar.',
          targetMinutes: session.duration,
          fromCalendar: true,
        }).id;
      }
      recordActivity(req.userId, body.clientDay && isoDate(body.clientDay));
      return insertSession(req.userId, { ...session, activityId });
    });
    res.status(201).location(`${req.baseUrl}/${created.id}`).json(toApi(created));
  });

  router.patch('/:id', (req, res) => {
    const body = plainObject(req.body);
    const updated = transaction(() => {
      const old = toApi(findSession(req.userId, id(req.params.id)));
      const next = {
        type: 'type' in body ? sessionType(body.type) : old.type,
        title: 'title' in body ? requiredText(body.title, 'Title') : old.title,
        date: 'date' in body ? isoDate(body.date) : old.date,
        startTime: 'startTime' in body ? clockTime(body.startTime) : old.startTime,
        duration: 'duration' in body ? minutes(body.duration, 'Duration') : old.duration,
        completed: 'completed' in body ? boolean(body.completed, 'completed') : old.completed,
      };
      const typeChanged = next.type !== old.type;
      next.activityId = 'linkedItemId' in body ? linkedActivityId(req.userId, next.type, body.linkedItemId)
        : typeChanged ? null : old.linkedItemId;
      // Keep an auto-created task/exercise in step with its session.
      if (next.activityId && !typeChanged) {
        const kind = kindForType(next.type);
        if (findActivity(req.userId, kind, next.activityId).from_calendar) {
          updateActivity(req.userId, kind, next.activityId, { title: next.title, targetMinutes: next.duration });
        }
      }
      recordActivity(req.userId, body.clientDay && isoDate(body.clientDay));
      return saveSession(req.userId, old.id, next);
    });
    res.json(toApi(updated));
  });

  router.delete('/:id', (req, res) => {
    deleteSession(req.userId, id(req.params.id));
    res.status(204).end();
  });

  return router;
}
