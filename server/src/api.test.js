// REST API tests: CRUD for every resource, ownership checks, validation, sensors and rate limiting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'balanceboard-api-'));
process.env.DB_PATH = join(dir, 'api.sqlite');
process.env.APP_ORIGIN = 'http://localhost:5173';
const { app } = await import('./server.js');
const server = app.listen(0);
const origin = `http://127.0.0.1:${server.address().port}`;
test.after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

async function call(path, method = 'GET', body, cookie, headers = {}) {
  const response = await fetch(origin + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null, cookie: response.headers.get('set-cookie')?.split(';')[0], location: response.headers.get('location') };
}
async function signUp(username) {
  const res = await call('/api/auth/register', 'POST', { username, password: 'a sufficiently long password' });
  assert.equal(res.status, 201);
  return res.cookie;
}

const alice = await signUp('api_alice');
const bob = await signUp('api_bob');

test('tasks: create, read, update, progress, delete', async () => {
  const created = await call('/api/tasks', 'POST', { title: 'Read chapter 4', category: 'Learning', focusMinutes: 30 }, alice);
  assert.equal(created.status, 201);
  assert.equal(created.location, `/api/tasks/${created.data.id}`);
  assert.deepEqual([created.data.title, created.data.focusMinutes, created.data.completedFocusMinutes, created.data.completed], ['Read chapter 4', 30, 0, false]);
  const tid = created.data.id;
  assert.equal((await call(`/api/tasks/${tid}`, 'GET', undefined, alice)).data.category, 'Learning');
  assert.equal((await call('/api/tasks', 'GET', undefined, alice)).data.length, 1);

  const edited = await call(`/api/tasks/${tid}`, 'PATCH', { title: 'Read chapter 5', focusMinutes: 20 }, alice);
  assert.equal(edited.status, 200);
  assert.deepEqual([edited.data.title, edited.data.focusMinutes, edited.data.category], ['Read chapter 5', 20, 'Learning']);

  const progress = await call(`/api/tasks/${tid}/progress`, 'POST', { minutes: 25 }, alice);
  assert.equal(progress.data.completedFocusMinutes, 20, 'progress is capped at the target');
  assert.equal(progress.data.completed, true);
  assert.equal((await call(`/api/tasks/${tid}`, 'PATCH', { completed: false }, alice)).data.completed, false);

  assert.equal((await call(`/api/tasks/${tid}`, 'DELETE', undefined, alice)).status, 204);
  assert.equal((await call(`/api/tasks/${tid}`, 'GET', undefined, alice)).status, 404);
});

test('exercises: CRUD uses exercise field names', async () => {
  const created = await call('/api/exercises', 'POST', { title: 'Evening run', exerciseMinutes: 20 }, alice);
  assert.equal(created.status, 201);
  assert.deepEqual([created.data.category, created.data.exerciseMinutes, created.data.steps], ['Exercise', 20, 0]);
  const eid = created.data.id;
  assert.equal((await call(`/api/exercises/${eid}`, 'PATCH', { description: 'Around the park' }, alice)).data.description, 'Around the park');
  assert.equal((await call(`/api/tasks/${eid}`, 'GET', undefined, alice)).status, 404, 'an exercise is not reachable as a task');
  assert.equal((await call(`/api/exercises/${eid}`, 'DELETE', undefined, alice)).status, 204);
});

test('ownership: another user cannot read, change or delete records (IDOR)', async () => {
  const task = (await call('/api/tasks', 'POST', { title: 'Private' }, alice)).data;
  const session = (await call('/api/sessions', 'POST', { type: 'study', title: 'Private session', date: '2026-10-10', startTime: '09:00', duration: 30 }, alice)).data;
  for (const [path, method, body] of [
    [`/api/tasks/${task.id}`, 'GET'], [`/api/tasks/${task.id}`, 'PATCH', { title: 'x' }], [`/api/tasks/${task.id}`, 'DELETE'],
    [`/api/tasks/${task.id}/progress`, 'POST', { minutes: 5 }], [`/api/sessions/${session.id}`, 'PATCH', { title: 'x' }],
    [`/api/sessions/${session.id}`, 'DELETE'], ['/api/sensor-readings', 'POST', { exerciseId: task.id, steps: 1, durationSeconds: 10 }],
    ['/api/sessions', 'POST', { type: 'study', title: 'Link', date: '2026-10-10', startTime: '10:00', duration: 5, linkedItemId: task.id }],
  ]) assert.equal((await call(path, method, body, bob)).status, 404, `${method} ${path}`);
  assert.equal((await call('/api/tasks', 'GET', undefined, bob)).data.length, 0);
  assert.equal((await call(`/api/tasks/${task.id}`, 'GET', undefined, alice)).data.title, 'Private');
});

test('sessions: auto-create a linked task, keep it in sync, and unlink on delete', async () => {
  const created = await call('/api/sessions', 'POST', { type: 'study', title: 'Library study', date: '2026-10-12', startTime: '14:30', duration: 45 }, alice);
  assert.equal(created.status, 201);
  const linked = (await call(`/api/tasks/${created.data.linkedItemId}`, 'GET', undefined, alice)).data;
  assert.deepEqual([linked.title, linked.focusMinutes, linked.createdFromCalendar], ['Library study', 45, true]);

  const edited = await call(`/api/sessions/${created.data.id}`, 'PATCH', { title: 'Library study (group)', duration: 60, startTime: '15:00' }, alice);
  assert.deepEqual([edited.data.title, edited.data.startTime, edited.data.duration], ['Library study (group)', '15:00', 60]);
  assert.equal((await call(`/api/tasks/${linked.id}`, 'GET', undefined, alice)).data.focusMinutes, 60);

  assert.equal((await call(`/api/tasks/${linked.id}`, 'DELETE', undefined, alice)).status, 204);
  assert.equal((await call(`/api/sessions/${created.data.id}`, 'GET', undefined, alice)).data.linkedItemId, null, 'FK ON DELETE SET NULL');
  assert.equal((await call(`/api/sessions/${created.data.id}`, 'DELETE', undefined, alice)).status, 204);
});

test('validation: bad input is rejected with 400 and a clear message', async () => {
  const cases = [
    ['/api/tasks', 'POST', { title: '' }],
    ['/api/tasks', 'POST', { title: 'x'.repeat(161) }],
    ['/api/tasks', 'POST', { title: 'ok', focusMinutes: 0 }],
    ['/api/tasks', 'POST', { title: 'ok', focusMinutes: 2.5 }],
    ['/api/tasks', 'POST', ['not', 'an', 'object']],
    ['/api/sessions', 'POST', { type: 'nap', title: 'x', date: '2026-10-10', startTime: '09:00', duration: 5 }],
    ['/api/sessions', 'POST', { type: 'study', title: 'x', date: '2026-02-30', startTime: '09:00', duration: 5 }],
    ['/api/sessions', 'POST', { type: 'study', title: 'x', date: '2026-10-10', startTime: '24:00', duration: 5 }],
    ['/api/wellness/2026-10-10', 'PATCH', { mood: 'hacked!!' }],
    ['/api/wellness/2026-10-10', 'PATCH', { water: 9 }],
    ['/api/wellness/2026-10-10', 'PATCH', {}],
    ['/api/tasks/abc', 'GET'],
  ];
  for (const [path, method, body] of cases) {
    const res = await call(path, method, body, alice);
    assert.equal(res.status, 400, `${method} ${path} ${JSON.stringify(body)}`);
    assert.equal(typeof res.data.error, 'string');
  }
  const task = (await call('/api/tasks', 'POST', { title: 'Mass assignment', completed: true, completedFocusMinutes: 999, user_id: 2 }, alice)).data;
  assert.deepEqual([task.completed, task.completedFocusMinutes], [false, 0], 'server-controlled fields are ignored');
  assert.equal((await call('/api/tasks', 'POST', '{bad json', alice)).status, 400);
  assert.equal((await call('/api/tasks', 'POST', { title: 'a'.repeat(40000) }, alice)).status, 413);
});

test('wellness: mood and water are stored per day', async () => {
  assert.deepEqual((await call('/api/wellness/2026-10-11', 'PATCH', { mood: 'great', water: 3 }, alice)).data, { day: '2026-10-11', mood: 'great', water: 3 });
  assert.deepEqual((await call('/api/wellness/2026-10-11', 'PATCH', { water: 4 }, alice)).data, { day: '2026-10-11', mood: 'great', water: 4 });
  assert.deepEqual((await call('/api/wellness/2026-10-12', 'GET', undefined, alice)).data, { day: '2026-10-12', mood: '', water: 0 });
  assert.equal((await call('/api/wellness/2026-10-11', 'GET', undefined, bob)).data.water, 0);
});

test('sensor readings: accelerometer steps are stored, summed and validated', async () => {
  const exercise = (await call('/api/exercises', 'POST', { title: 'Walk', exerciseMinutes: 10 }, alice)).data;
  const reading = await call('/api/sensor-readings', 'POST', { exerciseId: exercise.id, steps: 240, durationSeconds: 180, clientDay: '2026-10-11' }, alice);
  assert.equal(reading.status, 201);
  assert.deepEqual([reading.data.sensor, reading.data.metric, reading.data.value], ['accelerometer', 'steps', 240]);
  await call('/api/sensor-readings', 'POST', { exerciseId: exercise.id, steps: 60, durationSeconds: 60, clientDay: '2026-10-11' }, alice);
  assert.equal((await call(`/api/exercises/${exercise.id}`, 'GET', undefined, alice)).data.steps, 300);
  assert.equal((await call('/api/sensor-readings?from=2026-10-11&to=2026-10-11', 'GET', undefined, alice)).data.length, 2);
  assert.equal((await call('/api/sensor-readings', 'GET', undefined, bob)).data.length, 0);
  assert.equal((await call('/api/sensor-readings', 'POST', { exerciseId: exercise.id, steps: 5000, durationSeconds: 60 }, alice)).status, 400, 'implausible step rate');
  assert.equal((await call('/api/sensor-readings', 'POST', { exerciseId: exercise.id, steps: -1, durationSeconds: 60 }, alice)).status, 400);
});

test('security: auth required, cross-origin writes blocked, unknown routes 404', async () => {
  assert.equal((await call('/api/tasks')).status, 401);
  assert.equal((await call('/api/tasks', 'POST', { title: 'x' }, alice, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('/api/does-not-exist', 'GET', undefined, alice)).status, 404);
  const login = await call('/api/auth/login', 'POST', { username: "api_alice' OR 1=1--", password: 'anything' });
  assert.equal(login.status, 401);
});

test('rate limit: successful logins do not lock a user out; repeated failures do', async () => {
  for (let i = 0; i < 20; i++) assert.equal((await call('/api/auth/login', 'POST', { username: 'api_bob', password: 'a sufficiently long password' })).status, 200);
  let last;
  for (let i = 0; i < 16; i++) last = (await call('/api/auth/login', 'POST', { username: 'api_bob', password: 'wrong password' })).status;
  assert.equal(last, 429);
});
