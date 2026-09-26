import { useEffect, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { api, localDay } from '../../services/api';
import { playAlarm, vibrateAlarm } from '../../services/alarms';

export default function Reminders() {
  const {scheduledSessions}=useDashboard();
  const {profile,user}=useAuth();
  const [now,setNow]=useState(Date.now());
  const [active,setActive]=useState(null);
  const [soundBlocked,setSoundBlocked]=useState(false);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),15_000);return ()=>clearInterval(timer);},[]);
  useEffect(()=>{setActive(null);},[user?.id]);
  useEffect(()=>{
    if(!profile?.alarm.enabled) return;
    let cancelled=false;
    const clock=new Date();
    const time=`${String(clock.getHours()).padStart(2,'0')}:${String(clock.getMinutes()).padStart(2,'0')}`;
    api(`/alarms/due?day=${localDay()}&time=${time}`).then(async ({alarms,settings})=>{
      if(cancelled) return;
      for(const alarm of alarms) {
        const key=`bb-alarm-${user.id}-${alarm.id}-${alarm.date}-${alarm.startTime}`;
        if(sessionStorage.getItem(key)) continue;
        sessionStorage.setItem(key,'1');
        setActive(alarm);
        if(settings.sound) setSoundBlocked(!(await playAlarm()));
        if(settings.vibrate) vibrateAlarm();
        if(settings.desktop && typeof Notification!=='undefined' && Notification.permission==='granted') {
          new Notification('BalanceBoard session starts now', {body:alarm.title,tag:key});
        }
      }
    }).catch(()=>{});
    return ()=>{cancelled=true;};
  },[now,user?.id,profile?.alarm.enabled]);
  const lead=profile?.alarm.enabled ? profile.alarm.reminderMinutes : 0;
  const upcoming=profile?.alarm.enabled ? scheduledSessions.filter(s=>!s.completed)
    .map(s=>({...s,when:new Date(`${s.date}T${s.startTime}:00`).getTime()}))
    .filter(s=>s.when>=now && s.when<=now+lead*60_000).sort((a,b)=>a.when-b.when) : [];
  if(!active && !upcoming.length) return null;
  return <div className="reminder-banner" role={active?'alert':'status'}>
    {active ? <>
      <span>⏰ <strong>{active.title}</strong> starts now ({active.startTime}). {soundBlocked?'Tap Play sound if your browser blocked automatic audio.':''}</span>
      <div className="alarm-controls"><button type="button" onClick={()=>{playAlarm();vibrateAlarm();}}>Play sound</button><button type="button" onClick={()=>setActive(null)}>Dismiss</button></div>
    </> : <>
      <span>⏰ {upcoming[0].title} starts at {upcoming[0].startTime} ({Math.max(0,Math.ceil((upcoming[0].when-now)/60000))} min). {upcoming.length>1?`+${upcoming.length-1} more soon.`:''}</span>
      {profile.alarm.desktop && typeof Notification!=='undefined' && Notification.permission==='default' && <button type="button" onClick={()=>Notification.requestPermission()}>Enable desktop notifications</button>}
    </>}
  </div>;
}
