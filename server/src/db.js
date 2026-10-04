// SQLite connection, relational schema and one-off migration from the legacy JSON "items" table.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

mkdirSync(dirname(config.dbPath), { recursive: true });
export const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');

const MOOD_CHECK = "mood IN ('','great','good','okay','low','stressed')";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS google_identities (
  google_sub TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  alarm_enabled INTEGER NOT NULL DEFAULT 1,
  alarm_sound INTEGER NOT NULL DEFAULT 1,
  alarm_vibrate INTEGER NOT NULL DEFAULT 1,
  alarm_desktop INTEGER NOT NULL DEFAULT 1,
  reminder_minutes INTEGER NOT NULL DEFAULT 30
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('task','exercise')),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  target_minutes INTEGER NOT NULL CHECK (target_minutes BETWEEN 1 AND 1440),
  completed_minutes REAL NOT NULL DEFAULT 0 CHECK (completed_minutes >= 0),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  from_calendar INTEGER NOT NULL DEFAULT 0 CHECK (from_calendar IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS activities_owner ON activities(user_id, kind);
CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('study','exercise')),
  title TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS sessions_owner_day ON scheduled_sessions(user_id, day);
CREATE TABLE IF NOT EXISTS wellness_logs (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT '' CHECK (${MOOD_CHECK}),
  water_cups INTEGER NOT NULL DEFAULT 0 CHECK (water_cups BETWEEN 0 AND 8),
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS activity_days (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS focus_timers (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  timer_id TEXT NOT NULL,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('task','exercise')),
  session_id INTEGER REFERENCES scheduled_sessions(id) ON DELETE SET NULL,
  total_ms INTEGER NOT NULL,
  remaining_ms INTEGER NOT NULL,
  started_at INTEGER,
  revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS sensor_readings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  sensor TEXT NOT NULL CHECK (sensor IN ('accelerometer')),
  metric TEXT NOT NULL CHECK (metric IN ('steps')),
  value INTEGER NOT NULL CHECK (value BETWEEN 0 AND 100000),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 1 AND 86400),
  day TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS sensor_owner_day ON sensor_readings(user_id, day);
`;

const tableExists = name => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));
const columns = name => db.prepare(`PRAGMA table_info(${name})`).all().map(c => c.name);

// Earlier versions stored tasks, exercises and calendar sessions as JSON in one "items" table.
// This copies them into typed tables (keeping their IDs, so links and timers stay valid).
function migrateLegacySchema() {
  const legacy = tableExists('items') || (tableExists('sessions') && columns('sessions').includes('token_hash'))
    || tableExists('activity') || (tableExists('wellness') && !tableExists('wellness_logs'));
  if (!legacy) return false;
  db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;');
  try {
    if (tableExists('sessions') && columns('sessions').includes('token_hash')) db.exec('ALTER TABLE sessions RENAME TO auth_sessions');
    if (tableExists('activity')) db.exec('ALTER TABLE activity RENAME TO activity_days');
    if (tableExists('focus_timers') && columns('focus_timers').includes('item_id')) db.exec('ALTER TABLE focus_timers RENAME TO legacy_focus_timers');
    db.exec(SCHEMA);
    if (tableExists('items')) {
      db.exec(`
        INSERT INTO activities (id, user_id, kind, title, category, description, target_minutes, completed_minutes, completed, from_calendar)
        SELECT id, user_id, kind,
          COALESCE(json_extract(payload,'$.title'),'Untitled'),
          COALESCE(json_extract(payload,'$.category'),''),
          COALESCE(json_extract(payload,'$.description'),''),
          MIN(1440, MAX(1, COALESCE(json_extract(payload, CASE kind WHEN 'task' THEN '$.focusMinutes' ELSE '$.exerciseMinutes' END), 25))),
          MAX(0, COALESCE(json_extract(payload, CASE kind WHEN 'task' THEN '$.completedFocusMinutes' ELSE '$.completedExerciseMinutes' END), 0)),
          CASE WHEN json_extract(payload,'$.completed') THEN 1 ELSE 0 END,
          CASE WHEN json_extract(payload,'$.createdFromCalendar') THEN 1 ELSE 0 END
        FROM items WHERE kind IN ('task','exercise');
        INSERT INTO scheduled_sessions (id, user_id, activity_id, type, title, day, start_time, duration_minutes, completed)
        SELECT i.id, i.user_id, a.id,
          CASE json_extract(i.payload,'$.type') WHEN 'exercise' THEN 'exercise' ELSE 'study' END,
          COALESCE(json_extract(i.payload,'$.title'),'Session'),
          json_extract(i.payload,'$.date'), json_extract(i.payload,'$.startTime'),
          MIN(1440, MAX(1, COALESCE(json_extract(i.payload,'$.duration'), 25))),
          CASE WHEN json_extract(i.payload,'$.completed') THEN 1 ELSE 0 END
        FROM items i LEFT JOIN activities a ON a.id = json_extract(i.payload,'$.linkedItemId') AND a.user_id = i.user_id
        WHERE i.kind = 'session';
        DROP TABLE items;`);
    }
    if (tableExists('legacy_focus_timers')) {
      db.exec(`INSERT OR IGNORE INTO focus_timers (user_id, timer_id, activity_id, kind, session_id, total_ms, remaining_ms, started_at, revision)
        SELECT t.user_id, t.timer_id, t.item_id, t.kind, s.id, t.total_ms, t.remaining_ms, t.started_at, t.revision
        FROM legacy_focus_timers t JOIN activities a ON a.id = t.item_id
        LEFT JOIN scheduled_sessions s ON s.id = t.calendar_id;
        DROP TABLE legacy_focus_timers;`);
    }
    if (tableExists('wellness')) {
      db.exec(`INSERT OR IGNORE INTO wellness_logs (user_id, day, mood, water_cups)
        SELECT user_id, day, CASE WHEN mood IN ('great','good','okay','low','stressed') THEN mood ELSE '' END, MIN(8, MAX(0, water))
        FROM wellness;
        DROP TABLE wellness;`);
    }
    const broken = db.prepare('PRAGMA foreign_key_check').all();
    if (broken.length) throw new Error(`Migration left ${broken.length} broken references.`);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.exec('PRAGMA foreign_keys=ON');
  }
  return true;
}

if (migrateLegacySchema()) console.log('BalanceBoard: migrated database to the relational schema.');
db.exec('PRAGMA foreign_keys=ON;');
db.exec(SCHEMA);

// Runs fn inside a write transaction and returns its result.
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
