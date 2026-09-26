import { useTimer } from "../../context/TimerContext";

export default function FocusTimer() {
  const { timer, status, remainingMs, formatted, busy, loading, error, command, sync } = useTimer();
  const exercise = timer?.kind === 'exercise';
  const progress = timer ? Math.max(0, Math.min(100, (1 - remainingMs / timer.totalMs) * 100)) : 0;
  return <article className="dashboard-card focus-card" id="focus-timer">
    <div className="card-heading">
      <div><p className="page-eyebrow">{exercise ? 'EXERCISE SESSION' : 'FOCUS SESSION'}</p><h2>{exercise ? 'Exercise timer' : 'Pomodoro timer'}</h2></div>
      <span className="card-icon" aria-hidden="true">{exercise ? '💪' : '🍅'}</span>
    </div>
    <div className="focus-task-area">
      <p className="focus-label">{timer ? 'CURRENT ACTIVITY' : 'READY TO START'}</p>
      <h3>{timer?.title || 'Select an activity below'}</h3>
      {timer?.category && <span className="focus-category">{timer.category}</span>}
      <p>{timer ? 'Your timer continues when you change pages or refresh.' : 'Choose Focus on a study task or exercise.'}</p>
    </div>
    <div className="modern-timer">
      <div className="timer-ring" style={{background:`conic-gradient(var(--primary-purple) ${progress * 3.6}deg, var(--light-lilac) 0deg)`}}>
        <div className="timer-inner">
          <p className="timer-status">{loading ? 'RESTORING' : status === 'running' ? 'RUNNING' : status === 'finished' ? 'FINISHED' : timer ? 'PAUSED' : 'READY'}</p>
          <h2 aria-label="Time remaining">{timer ? formatted : '25:00'}</h2>
          <p>{timer ? `${Math.round(timer.totalMs / 6000) / 10} minute session` : 'Select an activity'}</p>
        </div>
      </div>
    </div>
    {status === 'finished' && <p role="status">Session finished. Save your progress below.</p>}
    <div className="focus-controls">
      <button type="button" className="primary-button" disabled={!timer || busy || loading || status === 'finished'} onClick={()=>command(status === 'running' ? 'pause' : 'start')}>{status === 'running' ? 'Pause' : 'Start / Resume'}</button>
      <button type="button" className="secondary-button" disabled={!timer || busy || loading} onClick={()=>{if(window.confirm('Reset this timer and discard its unsaved elapsed time?')) command('reset');}}>Reset</button>
    </div>
    {timer && <>
      <button type="button" className="complete-focus-button" disabled={busy || timer.totalMs - remainingMs < 1000} onClick={()=>command('save')}>Save {exercise ? 'exercise' : 'focus'} progress</button>
      <button type="button" className="text-button timer-discard" disabled={busy} onClick={()=>{if(window.confirm('Discard this timer without saving progress?')) command('discard');}}>Discard timer</button>
    </>}
    {error && <p className="timer-error" role="alert">{error} <button type="button" onClick={sync}>Retry sync</button></p>}
  </article>;
}
