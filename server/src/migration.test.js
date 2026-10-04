// Checks that a database created by the earlier JSON-"items" version is migrated without data loss.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

test('legacy items/sessions/wellness tables migrate to the relational schema', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bb-migrate-'));
  const dbPath = join(dir, 'legacy.sqlite');
  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE TABLE items (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, payload TEXT NOT NULL);
    CREATE TABLE wellness (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL, mood TEXT NOT NULL DEFAULT '', water INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id,day));
    CREATE TABLE activity (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL, PRIMARY KEY(user_id,day));
    CREATE TABLE focus_timers (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, timer_id TEXT NOT NULL, item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE, kind TEXT NOT NULL, calendar_id INTEGER REFERENCES items(id) ON DELETE SET NULL, total_ms INTEGER NOT NULL, remaining_ms INTEGER NOT NULL, started_at INTEGER, revision INTEGER NOT NULL DEFAULT 1);
    INSERT INTO users (id, username, salt, password_hash) VALUES (1, 'legacy', 'salt', 'hash');
    INSERT INTO sessions VALUES ('tokenhash', 1, 9999999999999);
    INSERT INTO items VALUES (5, 1, 'task', '{"title":"Old task","category":"Study","description":"d","focusMinutes":25,"completedFocusMinutes":10,"completed":false}');
    INSERT INTO items VALUES (6, 1, 'exercise', '{"title":"Old run","category":"Running","description":"","exerciseMinutes":30,"completedExerciseMinutes":30,"completed":true}');
    INSERT INTO items VALUES (7, 1, 'session', '{"type":"study","title":"Old session","date":"2026-09-30","startTime":"10:00","duration":25,"linkedItemId":5,"completed":false}');
    INSERT INTO wellness VALUES (1, '2026-09-30', '🙂', 3), (1, '2026-10-01', 'great', 12);
    INSERT INTO activity VALUES (1, '2026-09-30');
    INSERT INTO focus_timers VALUES (1, 'timer-1', 5, 'task', 7, 900000, 900000, NULL, 1);`);
  legacy.close();

  process.env.DB_PATH = dbPath;
  const { db } = await import('./db.js');
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    for (const gone of ['items', 'sessions', 'wellness', 'activity', 'legacy_focus_timers']) assert.ok(!tables.includes(gone), `${gone} removed`);
    assert.deepEqual(db.prepare('SELECT id, kind, title, target_minutes, completed_minutes, completed FROM activities ORDER BY id').all().map(r => ({ ...r })), [
      { id: 5, kind: 'task', title: 'Old task', target_minutes: 25, completed_minutes: 10, completed: 0 },
      { id: 6, kind: 'exercise', title: 'Old run', target_minutes: 30, completed_minutes: 30, completed: 1 },
    ]);
    assert.deepEqual({ ...db.prepare('SELECT id, activity_id, type, day, start_time FROM scheduled_sessions').get() }, { id: 7, activity_id: 5, type: 'study', day: '2026-09-30', start_time: '10:00' });
    assert.deepEqual(db.prepare('SELECT day, mood, water_cups FROM wellness_logs ORDER BY day').all().map(r => ({ ...r })), [
      { day: '2026-09-30', mood: '', water_cups: 3 }, { day: '2026-10-01', mood: 'great', water_cups: 8 },
    ]);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM auth_sessions').get().n, 1, 'users stay signed in');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM activity_days').get().n, 1);
    assert.deepEqual({ ...db.prepare('SELECT activity_id, session_id FROM focus_timers').get() }, { activity_id: 5, session_id: 7 });
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
