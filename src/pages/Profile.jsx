import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { playAlarm, vibrateAlarm } from '../services/alarms';

export default function Profile() {
  const {user,profile,profileError,reloadProfile,saveProfile,changePassword}=useAuth();
  const [form,setForm]=useState(null);
  const [password,setPassword]=useState({current:'',next:''});
  const [status,setStatus]=useState('');
  const [working,setWorking]=useState(false);
  useEffect(()=>{if(profile) setForm({displayName:profile.displayName,email:profile.email,alarm:{...profile.alarm}});},[profile]);
  function setAlarm(key,value) {setForm(old=>({...old,alarm:{...old.alarm,[key]:value}}));}
  async function save(event) {
    event.preventDefault(); setWorking(true); setStatus('');
    try {await saveProfile(form); setStatus('Profile and alarm settings saved.');}
    catch(e) {setStatus(e.message);}
    finally {setWorking(false);}
  }
  async function updatePassword(event) {
    event.preventDefault(); setWorking(true); setStatus('');
    try {await changePassword(password.current,password.next); setPassword({current:'',next:''}); setStatus('Password updated. Other sessions were signed out.');}
    catch(e) {setStatus(e.message);}
    finally {setWorking(false);}
  }
  async function testAlarm() {
    const played=await playAlarm();
    const buzzed=vibrateAlarm();
    setStatus(`Sound ${played?'played':'blocked by this browser'}; vibration ${buzzed?'requested':'unavailable on this device'}.`);
  }
  return <Layout>
    <div className="settings-page">
      <p className="page-eyebrow">Your account</p>
      <h1>Profile &amp; alarm settings</h1>
      <p>Personalise your dashboard and choose how scheduled sessions alert you.</p>
      {!form ? profileError ? <p role="alert">Could not load your profile: {profileError} <button type="button" onClick={reloadProfile}>Retry</button></p> : <p>Loading profile…</p> : <>
        <div className="settings-grid">
          <section className="settings-card" aria-labelledby="account-heading">
            <h2 id="account-heading">Profile details</h2>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Sign-in:</strong> {profile.provider}</p>
            <p><strong>Joined:</strong> {new Date(`${profile.createdAt.replace(' ','T')}Z`).toLocaleDateString('en-AU')}</p>
            <form onSubmit={save}>
              <label htmlFor="display-name">Display name</label>
              <input id="display-name" maxLength="80" value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} />
              <label htmlFor="profile-email">Email (optional)</label>
              <input id="profile-email" type="email" maxLength="254" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              <small>Email is stored for your profile only; it is not verified or used for reminders.</small>
              <h3>Scheduled alarms</h3>
              <label className="settings-check"><input type="checkbox" checked={form.alarm.enabled} onChange={e=>setAlarm('enabled',e.target.checked)} /> Enable scheduled alarms</label>
              <label className="settings-check"><input type="checkbox" checked={form.alarm.sound} onChange={e=>setAlarm('sound',e.target.checked)} /> Play ringtone</label>
              <label className="settings-check"><input type="checkbox" checked={form.alarm.vibrate} onChange={e=>setAlarm('vibrate',e.target.checked)} /> Vibrate when supported</label>
              <label className="settings-check"><input type="checkbox" checked={form.alarm.desktop} onChange={e=>setAlarm('desktop',e.target.checked)} /> Desktop notification</label>
              <label htmlFor="reminder-minutes">Upcoming session banner</label>
              <select id="reminder-minutes" value={form.alarm.reminderMinutes} onChange={e=>setAlarm('reminderMinutes',Number(e.target.value))}>
                <option value="0">At start time</option><option value="5">5 minutes before</option><option value="10">10 minutes before</option><option value="30">30 minutes before</option>
              </select>
              <div className="settings-actions"><button type="submit" disabled={working}>Save settings</button><button type="button" onClick={testAlarm}>Test ringtone &amp; vibration</button></div>
            </form>
            {typeof Notification!=='undefined' && Notification.permission==='default' && <button type="button" className="settings-permission" onClick={()=>Notification.requestPermission()}>Allow desktop notifications</button>}
            <p className="settings-note">Keep BalanceBoard open for alarms. Browsers may block sound until you click Test; vibration depends on device and browser support. Alarms do not run when the app is closed.</p>
          </section>
          <section className="settings-card" aria-labelledby="security-heading">
            <h2 id="security-heading">Account security</h2>
            {profile.provider==='Google' ? <p>Your password is managed by Google.</p> : <form onSubmit={updatePassword}>
              <label htmlFor="current-password">Current password</label>
              <input id="current-password" type="password" autoComplete="current-password" required value={password.current} onChange={e=>setPassword({...password,current:e.target.value})} />
              <label htmlFor="new-password">New password (12+ characters)</label>
              <input id="new-password" type="password" minLength="12" autoComplete="new-password" required value={password.next} onChange={e=>setPassword({...password,next:e.target.value})} />
              <button type="submit" disabled={working}>Change password</button>
            </form>}
          </section>
        </div>
        {status && <p className="settings-status" role="status">{status}</p>}
      </>}
    </div>
  </Layout>;
}
