import express from 'express';

import { DatabaseSync } from 'node:sqlite';

import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';

import { promisify } from 'node:util';

import { mkdirSync, existsSync } from 'node:fs';

import { resolve, dirname } from 'node:path';

import { fileURLToPath } from 'node:url';

import { challenge, verifyGoogleIdToken } from './googleAuth.js';

import { registerTimerRoutes } from './timer.js';

const derivePassword = promisify(scrypt);



const root = dirname(fileURLToPath(import.meta.url));

if (existsSync(resolve(root,'../../.env'))) process.loadEnvFile(resolve(root,'../../.env'));

export const app = express();

const appOrigin = process.env.APP_ORIGIN?.replace(/\/$/, '');

if (appOrigin && (new URL(appOrigin).origin !== appOrigin || (!appOrigin.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(appOrigin)))) throw new Error('APP_ORIGIN must be an HTTPS origin or a localhost development origin.');

const googleClientId = process.env.GOOGLE_CLIENT_ID;

const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const googleEnabled = Boolean(appOrigin && googleClientId && googleClientSecret);

app.disable('x-powered-by');

if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

app.use(express.json({ limit: '32kb' }));

app.use((req, res, next) => {

  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader('Referrer-Policy', 'no-referrer');

  res.setHeader('X-Frame-Options', 'DENY');

  res.setHeader('Cache-Control', 'no-store');

  if (process.env.NODE_ENV === 'production') {

    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");

    if (appOrigin?.startsWith('https://')) res.setHeader('Strict-Transport-Security', 'max-age=31536000');

  }

  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
    const origin = req.get('origin');

    if (origin) {
      try {
        const host = (req.get('x-forwarded-host') || req.get('host') || '')
          .split(',')[0]
          .trim();

        const protocol = (req.get('x-forwarded-proto') || req.protocol || 'https')
          .split(',')[0]
          .trim();

        const requestOrigin = `${protocol}://${host}`;

        if (origin !== requestOrigin && origin !== appOrigin) {
          return res.status(403).json({ error: 'Invalid request origin.' });
        }
      } catch {
        return res.status(403).json({ error: 'Invalid request origin.' });
      }
    }
  }

  next();

});



const dbPath = resolve(process.env.DB_PATH || resolve(root, '../data/balanceboard.sqlite'));

mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;

CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS google_identities (google_sub TEXT PRIMARY KEY, user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS profiles (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, display_name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', alarm_enabled INTEGER NOT NULL DEFAULT 1, alarm_sound INTEGER NOT NULL DEFAULT 1, alarm_vibrate INTEGER NOT NULL DEFAULT 1, alarm_desktop INTEGER NOT NULL DEFAULT 1, reminder_minutes INTEGER NOT NULL DEFAULT 30);

CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL CHECK(kind IN ('task','exercise','session')), payload TEXT NOT NULL);

CREATE INDEX IF NOT EXISTS items_owner ON items(user_id,kind);

CREATE TABLE IF NOT EXISTS wellness (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL, mood TEXT NOT NULL DEFAULT '', water INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id,day));

CREATE TABLE IF NOT EXISTS activity (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL, PRIMARY KEY(user_id,day));`);



const cookieName = 'bb_session';

const oauthCookie = 'bb_google_flow';

const hash = value => createHash('sha256').update(value).digest('hex');

const cookie = req => (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);

const secure = req => req.secure || req.get('x-forwarded-proto') === 'https';

const setCookie = (res, token, isSecure) => res.append('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${isSecure ? '; Secure' : ''}`);

const clearCookie = res => res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);

const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };

const str = (value, label, max=160) => {

  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `${label} must be 1–${max} characters.`);

  return value.trim();

};

const optional = (value, max=1000) => {

  if (value == null) return '';

  if (typeof value !== 'string' || value.length > max) fail(400, `Text must be at most ${max} characters.`);

  return value.trim();

};

const minutes = value => {

  const n = Number(value);

  if (!Number.isInteger(n) || n < 1 || n > 1440) fail(400, 'Minutes must be between 1 and 1440.');

  return n;

};

const itemId = value => {

  const n = Number(value);

  if (!Number.isSafeInteger(n) || n < 1) fail(400, 'Invalid item ID.');

  return n;

};

const date = value => {

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0,10) !== value) fail(400, 'Invalid date.');

  return value;

};

const startTime = value => {

  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) fail(400, 'Invalid time.');

  return value;

};

const nowDay = () => new Date().toISOString().slice(0,10);

const row = (userId, kind, id) => {

  const found = db.prepare('SELECT * FROM items WHERE id=? AND user_id=? AND kind=?').get(itemId(id), userId, kind);

  if (!found) fail(404, 'Item not found.');

  return { ...JSON.parse(found.payload), id: found.id };

};

const insert = (userId, kind, data) => {

  const info = db.prepare('INSERT INTO items(user_id,kind,payload) VALUES(?,?,?)').run(userId,kind,JSON.stringify(data));

  return { ...data, id: Number(info.lastInsertRowid) };

};

const update = (userId, kind, id, data) => db.prepare('UPDATE items SET payload=? WHERE id=? AND user_id=? AND kind=?').run(JSON.stringify(data),itemId(id),userId,kind);

const owned = (userId, kind, id) => { if (id != null) row(userId, kind, id); return id == null ? null : itemId(id); };

const record = (userId,day=nowDay()) => db.prepare('INSERT OR IGNORE INTO activity(user_id,day) VALUES(?,?)').run(userId,date(day));

const failures = new Map();

const limitAuth = (req,res,next) => {

  const key = req.ip || 'local', t = Date.now();

  for (const [ip, entry] of failures) if(entry.until<t) failures.delete(ip);

  if (failures.size >= 5000 && !failures.has(key)) return res.status(429).json({error:'Too many requests. Try again later.'});

  const entry = failures.get(key) || { count:0, until:t+15*60_000 };

  if (entry.until < t) { entry.count=0; entry.until=t+15*60_000; }

  if (entry.count >= 15) return res.status(429).json({error:'Too many attempts. Try again later.'});

  entry.count++; failures.set(key,entry);

  req.authLimit = entry; req.authKey = key; next();

};

const issue = (req,res,user,respond=true) => {

  const token=randomBytes(32).toString('hex');

  db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());

  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+7*86400_000);

  setCookie(res,token,secure(req) || appOrigin?.startsWith('https:'));

  if(respond) res.json({ user: { id:user.id, username:user.username } });

};

const googleCookie = req => (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${oauthCookie}=`))?.slice(oauthCookie.length + 1);

const clearGoogleCookie = res => res.setHeader('Set-Cookie', `${oauthCookie}=; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age=0${appOrigin?.startsWith('https:') ? '; Secure' : ''}`);

const googleRedirect = `${appOrigin}/api/auth/google/callback`;

app.get('/api/auth/providers',(_req,res)=>res.json({google:googleEnabled}));

app.get('/api/auth/google',(req,res)=>{

  if (!googleEnabled) return res.status(503).json({error:'Google sign-in needs APP_ORIGIN, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'});

  const state=randomBytes(32).toString('base64url'), nonce=randomBytes(32).toString('base64url'), verifier=randomBytes(32).toString('base64url');

  res.setHeader('Set-Cookie', `${oauthCookie}=${state}.${nonce}.${verifier}; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age=600${appOrigin.startsWith('https:') ? '; Secure' : ''}`);

  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');

  for(const [key,value] of Object.entries({client_id:googleClientId,redirect_uri:googleRedirect,response_type:'code',scope:'openid email',state,nonce,code_challenge:challenge(verifier),code_challenge_method:'S256'})) url.searchParams.set(key,value);

  res.redirect(302,url.toString());

});

app.get('/api/auth/google/callback',async(req,res)=>{

  const flow=googleCookie(req)?.split('.') || [];

  clearGoogleCookie(res);

  const [state,nonce,verifier]=flow;

  const supplied=req.query.state;

  if(!googleEnabled || typeof supplied!=='string' || typeof req.query.code!=='string' ||

     ![supplied,state,nonce,verifier].every(value=>typeof value==='string' && /^[A-Za-z0-9_-]{43}$/.test(value)) || !timingSafeEqual(Buffer.from(supplied),Buffer.from(state)))

    return res.redirect(303,`${appOrigin || '/login'}${appOrigin ? '/login' : ''}?authError=google`);

  try {

    const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:req.query.code,client_id:googleClientId,client_secret:googleClientSecret,redirect_uri:googleRedirect,grant_type:'authorization_code',code_verifier:verifier}),signal:AbortSignal.timeout(10000)});

    if(!response.ok) throw new Error('Google token exchange failed.');

    const token=await response.json();

    const identity=await verifyGoogleIdToken(token.id_token,googleClientId,nonce);

    let user=db.prepare('SELECT users.id,users.username FROM users JOIN google_identities ON google_identities.user_id=users.id WHERE google_identities.google_sub=?').get(identity.sub);

    if(!user) {

      db.exec('BEGIN IMMEDIATE');

      try {

        user=db.prepare('SELECT users.id,users.username FROM users JOIN google_identities ON google_identities.user_id=users.id WHERE google_identities.google_sub=?').get(identity.sub);

        if(!user) {

          const base=identity.email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g,'_').replace(/^[^a-zA-Z0-9_]/,'g').slice(0,28) || 'google_user';

          let username=base.length>=3?base:`google_${base}`;

          let n=1;

          while(db.prepare('SELECT 1 FROM users WHERE username=?').get(username)) username=`${base}_${n++}`;

          const salt=randomBytes(16).toString('hex');

          const passwordHash=randomBytes(64).toString('hex');

          const id=Number(db.prepare('INSERT INTO users(username,salt,password_hash) VALUES(?,?,?)').run(username,salt,passwordHash).lastInsertRowid);

          db.prepare('INSERT INTO google_identities(google_sub,user_id) VALUES(?,?)').run(identity.sub,id);

          db.prepare('INSERT INTO profiles(user_id,display_name,email) VALUES(?,?,?)').run(id,identity.email.split('@')[0].slice(0,80),identity.email);

          user={id,username};

        }

        db.exec('COMMIT');

      } catch(e) { db.exec('ROLLBACK'); throw e; }

    }

    issue(req,res,user,false);

    res.redirect(303,`${appOrigin}/dashboard`);

  } catch(e) { console.error('Google sign-in:',e); res.redirect(303,`${appOrigin}/login?authError=google`); }

});

app.post('/api/auth/register',limitAuth,async(req,res,next)=>{ try {

  const username=str(req.body?.username,'Username',40);

  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_.-]{2,39}$/.test(username)) fail(400,'Username must be 3–40 letters, numbers, dots, underscores or hyphens.');

  const password=req.body?.password;

  if (typeof password !== 'string' || password.length < 12 || password.length > 128) fail(400,'Password must be 12–128 characters.');

  if (db.prepare('SELECT id FROM users WHERE username=?').get(username)) fail(409,'Username already exists.');

  const salt=randomBytes(16).toString('hex'), passwordHash=(await derivePassword(password,salt,64)).toString('hex');

  const id=Number(db.prepare('INSERT INTO users(username,salt,password_hash) VALUES(?,?,?)').run(username,salt,passwordHash).lastInsertRowid);

  issue(req,res,{id,username});

} catch(e) { next(e); } });

app.post('/api/auth/login',limitAuth,async(req,res,next)=>{ try {

  const username=String(req.body?.username || '').slice(0,100), password=req.body?.password;

  if (typeof password !== 'string' || password.length > 128) fail(401,'Invalid username or password.');

  const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);

  const candidate=await derivePassword(password,user?.salt || '00000000000000000000000000000000',64);

  if (!user || !timingSafeEqual(candidate,Buffer.from(user.password_hash,'hex'))) fail(401,'Invalid username or password.');

  if (db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id)?.password_hash !== user.password_hash) fail(401,'Password changed. Please sign in again.');

  issue(req,res,user);

} catch(e) { next(e); } });

app.get('/api/health',(_req,res)=>res.json({status:'ok'}));

app.use('/api',(req,res,next)=>{

  const token=cookie(req);

  const session=token && db.prepare('SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(token),Date.now());

  if (!session) return res.status(401).json({error:'Your session expired. Sign in to continue.',code:'SESSION_EXPIRED'});

  req.userId=session.user_id; next();

});

app.get('/api/auth/me',(req,res)=>{ const user=db.prepare('SELECT id,username FROM users WHERE id=?').get(req.userId); res.json({user}); });

app.post('/api/auth/logout',(req,res)=>{ const token=cookie(req); if(token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token)); clearCookie(res); res.json({ok:true}); });

registerTimerRoutes(app, { db, row, update, record, fail, date });

const profileFor = userId => {

  const user=db.prepare(`SELECT users.id,users.username,users.created_at,COALESCE(profiles.display_name,'') AS display_name,COALESCE(profiles.email,'') AS email,

    COALESCE(profiles.alarm_enabled,1) AS alarm_enabled,COALESCE(profiles.alarm_sound,1) AS alarm_sound,

    COALESCE(profiles.alarm_vibrate,1) AS alarm_vibrate,COALESCE(profiles.alarm_desktop,1) AS alarm_desktop,

    COALESCE(profiles.reminder_minutes,30) AS reminder_minutes,

    EXISTS(SELECT 1 FROM google_identities WHERE user_id=users.id) AS google_account

    FROM users LEFT JOIN profiles ON profiles.user_id=users.id WHERE users.id=?`).get(userId);

  return {username:user.username,displayName:user.display_name,email:user.email,createdAt:user.created_at,provider:user.google_account?'Google':'Password',alarm:{enabled:!!user.alarm_enabled,sound:!!user.alarm_sound,vibrate:!!user.alarm_vibrate,desktop:!!user.alarm_desktop,reminderMinutes:user.reminder_minutes}};

};

app.get('/api/profile',(req,res)=>res.json(profileFor(req.userId)));

app.patch('/api/profile',(req,res,next)=>{ try {

  const {displayName,email,alarm}=req.body || {};

  if(typeof displayName!=='string' || displayName.length>80 || typeof email!=='string' || email.length>254 ||

      (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) || !alarm || typeof alarm!=='object' || Array.isArray(alarm) ||

      ['enabled','sound','vibrate','desktop'].some(k=>typeof alarm[k]!=='boolean') ||

      ![0,5,10,30].includes(alarm.reminderMinutes)) fail(400,'Invalid profile or alarm settings.');

  db.prepare('INSERT OR IGNORE INTO profiles(user_id) VALUES(?)').run(req.userId);

  db.prepare('UPDATE profiles SET display_name=?,email=?,alarm_enabled=?,alarm_sound=?,alarm_vibrate=?,alarm_desktop=?,reminder_minutes=? WHERE user_id=?')

    .run(displayName.trim(),email.trim(),Number(alarm.enabled),Number(alarm.sound),Number(alarm.vibrate),Number(alarm.desktop),alarm.reminderMinutes,req.userId);

  res.json(profileFor(req.userId));

} catch(e) { next(e); } });

app.patch('/api/profile/password',limitAuth,async(req,res,next)=>{ try {

  const {currentPassword,newPassword}=req.body || {};

  if(typeof currentPassword!=='string' || currentPassword.length>128 || typeof newPassword!=='string' || newPassword.length<12 || newPassword.length>128) fail(400,'New password must be 12–128 characters.');

  if(db.prepare('SELECT 1 FROM google_identities WHERE user_id=?').get(req.userId)) fail(400,'Google accounts do not have a local password.');

  const user=db.prepare('SELECT salt,password_hash FROM users WHERE id=?').get(req.userId);

  const current=await derivePassword(currentPassword,user.salt,64);

  if(!timingSafeEqual(current,Buffer.from(user.password_hash,'hex'))) fail(401,'Current password is incorrect.');

  const salt=randomBytes(16).toString('hex');

  const newHash=(await derivePassword(newPassword,salt,64)).toString('hex');

  const changed=db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=? AND password_hash=?').run(salt,newHash,req.userId,user.password_hash);

  if(!changed.changes) fail(409,'Password changed in another request. Please sign in again.');

  const token=cookie(req);

  db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(req.userId,hash(token));

  res.json({ok:true});

} catch(e) { next(e); } });

app.get('/api/alarms/due',(req,res,next)=>{ try {

  const day=date(req.query.day), time=startTime(req.query.time);

  const prefs=profileFor(req.userId).alarm;

  if(!prefs.enabled) return res.json({alarms:[],settings:prefs});

  const now=Number(time.slice(0,2))*60+Number(time.slice(3));

  const alarms=db.prepare("SELECT id,payload FROM items WHERE user_id=? AND kind='session'").all(req.userId)

    .map(x=>({...JSON.parse(x.payload),id:x.id}))

    .filter(x=>!x.completed && x.date===day && now-(Number(x.startTime.slice(0,2))*60+Number(x.startTime.slice(3)))>=0 && now-(Number(x.startTime.slice(0,2))*60+Number(x.startTime.slice(3)))<2)

    .map(({id,title,date,startTime,type})=>({id,title,date,startTime,type}));

  res.json({alarms,settings:prefs});

} catch(e) { next(e); } });

app.get('/api/dashboard',(req,res)=>{

  const all=db.prepare('SELECT id,kind,payload FROM items WHERE user_id=? ORDER BY id').all(req.userId);

  const items=kind=>all.filter(x=>x.kind===kind).map(x=>({...JSON.parse(x.payload),id:x.id}));

  const day=date(req.query.day || nowDay());

  const wellness=db.prepare('SELECT mood,water FROM wellness WHERE user_id=? AND day=?').get(req.userId,day) || {mood:'',water:0};

  const days=db.prepare('SELECT day FROM activity WHERE user_id=? ORDER BY day DESC').all(req.userId).map(x=>x.day);

  let streak=0, cursor=new Date(`${day}T12:00:00Z`);

  if (days[0] !== day) cursor.setUTCDate(cursor.getUTCDate()-1);

  const set=new Set(days);

  while(set.has(cursor.toISOString().slice(0,10))) { streak++; cursor.setUTCDate(cursor.getUTCDate()-1); }

  res.json({tasks:items('task'),exercises:items('exercise'),scheduledSessions:items('session').sort((a,b)=>`${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)),wellness,streak});

});

app.post('/api/actions',(req,res,next)=>{ try {

  const {type,payload={}}=req.body || {};

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail(400,'Invalid payload.');

  const u=req.userId;

  db.exec('BEGIN IMMEDIATE');

  try {

    let result;

    if (type==='task.add' || type==='exercise.add') {

      const task=type==='task.add', kind=task?'task':'exercise', target=minutes(payload[task?'focusMinutes':'exerciseMinutes'] ?? payload.estimatedMinutes ?? (task?25:30));

      result=insert(u,kind,{title:str(payload.title,'Title'),category:optional(payload.category,50)|| (task?'Study':'Exercise'),description:optional(payload.description),[task?'focusMinutes':'exerciseMinutes']:target,[task?'completedFocusMinutes':'completedExerciseMinutes']:0,completed:false});

    } else if (['task.delete','exercise.delete','session.delete'].includes(type)) {

      const kind=type.split('.')[0]; row(u,kind,payload.id);

      db.prepare('DELETE FROM items WHERE user_id=? AND kind=? AND id=?').run(u,kind,itemId(payload.id));

      if(kind!=='session') db.prepare("UPDATE items SET payload=json_set(payload,'$.linkedItemId',null) WHERE user_id=? AND kind='session' AND json_extract(payload,'$.linkedItemId')=?").run(u,itemId(payload.id));

    } else if (['task.toggle','exercise.toggle','task.time','exercise.time'].includes(type)) {

      const kind=type.split('.')[0], item=row(u,kind,payload.id), key=kind==='task'?'completedFocusMinutes':'completedExerciseMinutes', target=kind==='task'?'focusMinutes':'exerciseMinutes';

      if(type.endsWith('toggle')) item.completed=!item.completed;

      else { item[key]=Math.min(item[target],item[key]+minutes(payload.minutes)); if(item[key]>=item[target]) item.completed=true; }

      update(u,kind,payload.id,((({id,...rest})=>rest)(item))); record(u,req.body.clientDay || nowDay());

    } else if (type==='wellness.mood' || type==='wellness.water') {

      const day=date(payload.day || nowDay());

      db.prepare('INSERT OR IGNORE INTO wellness(user_id,day) VALUES(?,?)').run(u,day);

      if(type==='wellness.mood') db.prepare('UPDATE wellness SET mood=? WHERE user_id=? AND day=?').run(optional(payload.mood,10),u,day);

      else { const delta=Number(payload.delta); if(delta!==1 && delta!==-1) fail(400,'Invalid water change.'); db.prepare('UPDATE wellness SET water=max(0,min(8,water+?)) WHERE user_id=? AND day=?').run(delta,u,day); }

      record(u,req.body.clientDay || nowDay());

    } else if (type==='session.add' || type==='session.update') {

      const old=type==='session.update'?row(u,'session',payload.id):null;

      const input=type==='session.update'?{...old,...payload}:payload;

      const kind=input.type==='exercise'?'exercise':input.type==='study'?'task':fail(400,'Invalid session type.');

      const title=str(input.title,'Title'), duration=minutes(input.duration), linked=owned(u,kind,input.linkedItemId ? input.linkedItemId:null);

      let linkedItemId=linked;

      if(!old && !linked) linkedItemId=insert(u,kind,{title,category:kind==='task'?'Study':'Exercise',description:'Scheduled from BalanceBoard Calendar.',[kind==='task'?'focusMinutes':'exerciseMinutes']:duration,[kind==='task'?'completedFocusMinutes':'completedExerciseMinutes']:0,completed:false,createdFromCalendar:true}).id;

      const data={type:input.type,title,date:date(input.date),startTime:startTime(input.startTime),duration,linkedItemId,completed:!!input.completed};

      if(old) { update(u,'session',old.id,data); result={...data,id:old.id}; }

      else result=insert(u,'session',data);

      if(old && linkedItemId && old.type===input.type) {const item=row(u,kind,linkedItemId); if(item.createdFromCalendar) update(u,kind,linkedItemId,{...item,title,[kind==='task'?'focusMinutes':'exerciseMinutes']:duration});}

      record(u,req.body.clientDay || nowDay());

    } else fail(400,'Unsupported action.');

    db.exec('COMMIT'); res.json({ok:true,result});

  } catch(e) { db.exec('ROLLBACK'); throw e; }

} catch(e) { next(e); } });

app.use('/api', (_req, res) =>
  res.status(404).json({ error: 'API endpoint not found.' })
);

// Serve the built React app in production. API routes always take priority.
const dist = resolve(root, '../../dist');

if (existsSync(resolve(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, etag: true }));

  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api/') &&
      req.accepts('html')
    ) {
      return res.sendFile(resolve(dist, 'index.html'));
    }

    next();
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON.' });
  }

  const code = err.code?.startsWith('SQLITE_CONSTRAINT')
    ? 409
    : err.status || 500;

  if (code === 500) console.error(err);

  res.status(code).json({
    error:
      code === 500
        ? 'Internal server error.'
        : err.code?.startsWith('SQLITE_CONSTRAINT')
          ? 'This operation conflicts with existing data. Please refresh and try again.'
          : err.message
  });
});

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 3001);

  app.listen(port, () =>
    console.log(`BalanceBoard API listening on http://localhost:${port}`)
  );
}