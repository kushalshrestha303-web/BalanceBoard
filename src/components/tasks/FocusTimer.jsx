import { useTimer } from "../../context/TimerContext";

const SENSOR_MESSAGES = {
  unsupported: 'Step counting needs a phone browser on a secure (HTTPS) page. Time is still tracked.',
  'needs-permission': 'Allow motion access to count your steps during this exercise.',
  denied: 'Motion access was refused, so steps are not counted. You can allow it in your browser settings.',
  ready: 'Start the timer and carry your phone; steps are counted with the accelerometer.',
  counting: 'Counting steps with your phone\'s accelerometer.',
  'no-data': 'No motion data from this device (desktop computers have no accelerometer). Time is still tracked.',
};

// Live step count from the accelerometer while an exercise timer is selected.
function StepSensorPanel({ sensor }) {
  return <div className="sensor-panel" role="status" aria-live="polite">
    <div className="sensor-panel-count">
      <span aria-hidden="true">👣</span>
      <strong>{sensor.sessionSteps}</strong>
      <span>steps this session</span>
    </div>
    <p>{SENSOR_MESSAGES[sensor.status]}</p>
    {sensor.status === 'needs-permission' && <button type="button" className="secondary-button" onClick={sensor.requestPermission}>Enable motion sensor</button>}
  </div>;
}

export default function FocusTimer() {
  const { timer, status, remainingMs, formatted, busy, loading, error, command, sync, sensor } = useTimer();
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
    {exercise && <StepSensorPanel sensor={sensor} />}
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
