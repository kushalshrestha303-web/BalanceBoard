import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useDashboard } from './DashboardContext';
import { api, localDay } from '../services/api';

const TimerContext = createContext(null);
export function TimerProvider({ children }) {
  const { user } = useAuth();
  const { refresh } = useDashboard();
  const [snapshot, setSnapshot] = useState({ timer: null, offset: 0 });
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const owner = useRef(user?.id);
  owner.current = user?.id;
  const sequence = useRef(0), changing = useRef(false);

  const sync = useCallback(async () => {
    if (!user || changing.current) return;
    const requestId = ++sequence.current, userId = user.id;
    try {
      const data = await api('/timer');
      if (requestId !== sequence.current || owner.current !== userId) return;
      setSnapshot({ timer: data.timer, offset: data.serverNow - Date.now() });
      setNow(Date.now()); setError('');
    } catch (e) { if (owner.current === userId) setError(e.message); }
    finally { if (owner.current === userId) setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    ++sequence.current; setSnapshot({ timer: null, offset: 0 }); setError(''); setLoading(!!user);
    if (!user) return;
    sync();
    const interval = setInterval(sync, 15000);
    const wake = () => { if (!document.hidden) sync(); };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('online', sync);
    return () => { ++sequence.current; clearInterval(interval); document.removeEventListener('visibilitychange', wake); window.removeEventListener('focus', wake); window.removeEventListener('online', sync); };
  }, [sync]);
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, []);

  async function mutate(path, method, body) {
    if (!user || changing.current) return false;
    changing.current = true; setBusy(true); setError('');
    const requestId = ++sequence.current, userId = user.id;
    try {
      const data = await api(path, { method, body: JSON.stringify(body) });
      if (requestId !== sequence.current || owner.current !== userId) return false;
      setSnapshot({ timer: data.timer, offset: data.serverNow - Date.now() }); setNow(Date.now());
      if (body.action === 'save') await refresh();
      return true;
    } catch (e) {
      if (owner.current === userId) {
        // Reconcile after timeouts or conflicts; a committed save must never be repeated blindly.
        try { const data = await api('/timer'); if (owner.current === userId) setSnapshot({ timer: data.timer, offset: data.serverNow - Date.now() }); } catch {}
        setError(e.message);
      }
      return false;
    } finally { changing.current = false; setBusy(false); setLoading(false); }
  }
  function select(kind, itemId, calendarSessionId = null) { return mutate('/timer', 'PUT', { kind, itemId, calendarSessionId }); }
  function command(action) {
    if (!snapshot.timer) return Promise.resolve(false);
    return mutate('/timer/actions', 'POST', { action, timerId: snapshot.timer.id, revision: snapshot.timer.revision, clientDay: localDay() });
  }
  const timer = snapshot.timer;
  const remainingMs = timer ? timer.status === 'running' ? Math.max(0, timer.deadline - now - snapshot.offset) : timer.remainingMs : 0;
  const status = timer && remainingMs === 0 ? 'finished' : timer?.status;
  const seconds = Math.ceil(remainingMs / 1000);
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <TimerContext.Provider value={{ timer, status, remainingMs, formatted, busy, loading, error, select, command, sync }}>{children}</TimerContext.Provider>;
}
export const useTimer = () => useContext(TimerContext);
