import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

test('timer survives server restart, pause/resume, stale tabs and duplicate saves', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'bb-timer-'));
  const dbPath = join(directory, 'test.sqlite');
  let child, origin;
  async function boot() {
    child = spawn(process.execPath, ['--input-type=module', '-e', "import {app} from './src/server.js'; const server=app.listen(0,'127.0.0.1',()=>console.log('READY '+server.address().port));"], {
      cwd: new URL('../', import.meta.url), env: { ...process.env, DB_PATH: dbPath, APP_ORIGIN: 'http://localhost:5173' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    origin = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
      child.stdout.on('data', data => {const match=String(data).match(/READY (\d+)/);if(match){clearTimeout(timeout);resolve(`http://127.0.0.1:${match[1]}`);}});
      child.once('error', reject); child.once('exit', code => {clearTimeout(timeout);if(code) reject(new Error(`Server exited ${code}`));});
    });
  }
  const stop = () => new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM'); });
  async function request(path, method='GET', body, cookie) {
    const response=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  try {
    await boot();
    const a=await request('/api/auth/register','POST',{username:'timer_alice',password:'strong timer password'});
    const b=await request('/api/auth/register','POST',{username:'timer_bob',password:'strong timer password'});
    const activity=await request('/api/tasks','POST',{title:'Persistent focus',focusMinutes:1},a.cookie);
    const itemId=activity.data.id;
    assert.equal((await request('/api/timer','PUT',{kind:'task',itemId},b.cookie)).status,404);
    let current=(await request('/api/timer','PUT',{kind:'task',itemId},a.cookie)).data.timer;
    async function act(action,timer=current) {return request('/api/timer/actions','POST',{action,timerId:timer.id,revision:timer.revision,clientDay:'2026-09-26'},a.cookie);}
    current=(await act('start')).data.timer;
    const stale={...current};
    await stop(); await boot();
    const restored=(await request('/api/timer','GET',null,a.cookie)).data.timer;
    assert.equal(restored.id,current.id); assert.equal(restored.deadline,current.deadline);
    assert.equal(restored.status,'running'); assert.ok(restored.remainingMs<60000);
    assert.equal((await request('/api/timer','GET',null,b.cookie)).data.timer,null);
    current=(await act('pause')).data.timer;
    assert.equal(current.status,'paused');
    assert.equal((await act('reset',stale)).status,409);
    const paused=(await request('/api/timer','GET',null,a.cookie)).data.timer;
    assert.equal(paused.remainingMs,current.remainingMs);
    current=(await act('start')).data.timer;
    const db=new DatabaseSync(dbPath);
    db.prepare('UPDATE focus_timers SET started_at=? WHERE timer_id=?').run(Date.now()-61000,current.id);
    db.close();
    current=(await request('/api/timer','GET',null,a.cookie)).data.timer;
    assert.equal(current.status,'finished'); assert.equal(current.remainingMs,0);
    assert.equal((await act('save')).status,200);
    assert.equal((await act('save')).status,409);
    const dashboard=(await request('/api/dashboard','GET',null,a.cookie)).data;
    assert.equal(dashboard.tasks[0].completedFocusMinutes,1);
    assert.equal(dashboard.tasks[0].completed,true);
    assert.equal((await request('/api/timer','GET',null,a.cookie)).data.timer,null);
  } finally { if(child?.exitCode===null) await stop(); rmSync(directory,{recursive:true,force:true}); }
});
