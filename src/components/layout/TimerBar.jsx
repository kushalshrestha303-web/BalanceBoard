import { Link, useLocation } from 'react-router-dom';
import { useTimer } from '../../context/TimerContext';

export default function TimerBar() {
  const { pathname } = useLocation();
  const { timer, formatted, status, busy, error, command, sync } = useTimer();
  if (pathname === '/dashboard' || (!timer && !error)) return null;
  return <aside className="persistent-timer" aria-label="Active Pomodoro timer">
    {timer && <>
      <Link to="/dashboard#focus-timer"><strong>{formatted}</strong> <span>{timer.title}</span></Link>
      <span>{status === 'finished' ? 'Finished — save your progress' : status === 'running' ? 'Timer running' : 'Paused'}</span>
      <div>
        {status !== 'finished' && <button type="button" disabled={busy} onClick={()=>command(status === 'running' ? 'pause' : 'start')}>{status === 'running' ? 'Pause' : 'Resume'}</button>}
        <button type="button" disabled={busy} onClick={()=>command('save')}>Save progress</button>
      </div>
    </>}
    {error && <p role="alert">{error} <button type="button" onClick={sync}>Retry</button></p>}
  </aside>;
}
