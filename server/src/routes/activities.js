// REST resources for study tasks (/api/tasks) and exercises (/api/exercises).
import { Router } from 'express';
import { transaction } from '../db.js';
import { fail } from '../lib/errors.js';
import { requiredText, optionalText, minutes, id, boolean, plainObject, isoDate } from '../lib/validate.js';
import { FIELDS, toApi, listActivities, findActivity, createActivity, updateActivity, addProgress, deleteActivity } from '../models/activities.js';
import { recordActivity } from '../models/activityDays.js';

export function activityRoutes(kind) {
  const f = FIELDS[kind];
  const router = Router();

  router.get('/', (req, res) => res.json(listActivities(req.userId, kind).map(toApi)));

  router.get('/:id', (req, res) => res.json(toApi(findActivity(req.userId, kind, id(req.params.id)))));

  router.post('/', (req, res) => {
    const body = plainObject(req.body);
    const created = createActivity(req.userId, kind, {
      title: requiredText(body.title, 'Title'),
      category: optionalText(body.category, 'Category', 50) || f.defaultCategory,
      description: optionalText(body.description, 'Description'),
      targetMinutes: minutes(body[f.target] ?? f.defaultMinutes, f.target),
    });
    res.status(201).location(`${req.baseUrl}/${created.id}`).json(toApi(created));
  });

  // Partial update. Only these fields are accepted; logged progress can only change through /progress or the timer.
  router.patch('/:id', (req, res) => {
    const body = plainObject(req.body);
    const changes = {};
    if ('title' in body) changes.title = requiredText(body.title, 'Title');
    if ('category' in body) changes.category = optionalText(body.category, 'Category', 50) || f.defaultCategory;
    if ('description' in body) changes.description = optionalText(body.description, 'Description');
    if (f.target in body) changes.targetMinutes = minutes(body[f.target], f.target);
    if ('completed' in body) changes.completed = boolean(body.completed, 'completed');
    if (!Object.keys(changes).length) fail(400, `Nothing to update. Allowed fields: title, category, description, ${f.target}, completed.`);
    const updated = transaction(() => {
      const row = updateActivity(req.userId, kind, id(req.params.id), changes);
      if ('completed' in changes) recordActivity(req.userId, body.clientDay && isoDate(body.clientDay));
      return row;
    });
    res.json(toApi(updated));
  });

  // Adds manually logged minutes of progress.
  router.post('/:id/progress', (req, res) => {
    const body = plainObject(req.body);
    const updated = transaction(() => {
      const row = addProgress(req.userId, kind, id(req.params.id), minutes(body.minutes));
      recordActivity(req.userId, body.clientDay && isoDate(body.clientDay));
      return row;
    });
    res.json(toApi(updated));
  });

  router.delete('/:id', (req, res) => {
    deleteActivity(req.userId, kind, id(req.params.id));
    res.status(204).end();
  });

  return router;
}
