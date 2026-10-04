import { useCallback, useEffect, useRef, useState } from 'react';
import { StepDetector } from '../services/stepDetector';
import { localDay } from '../services/api';

// Reads the phone's accelerometer while an EXERCISE timer is running and counts steps.
// Each running stretch (start → pause/finish/save) is saved as one sensor reading.
//
// status values:
//   'unsupported'      – no DeviceMotion API or not a secure (HTTPS) page
//   'needs-permission' – iOS: the user must tap "Enable motion sensor" first
//   'denied'           – the user refused motion access
//   'ready'            – will count steps when an exercise timer runs
//   'counting'         – receiving accelerometer data now
//   'no-data'          – API exists but no samples arrived (e.g. desktop computer)
const MIN_SECONDS_TO_SAVE = 3;
const NO_DATA_AFTER_MS = 4000;

export function useStepSensor({ timer, timerStatus, saveReading }) {
  const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window && window.isSecureContext;
  const needsPermission = supported && typeof window.DeviceMotionEvent.requestPermission === 'function';
  const [permission, setPermission] = useState(needsPermission ? 'unknown' : 'granted');
  const [status, setStatus] = useState(!supported ? 'unsupported' : needsPermission ? 'needs-permission' : 'ready');
  const [sessionSteps, setSessionSteps] = useState(0); // steps for the current timer, including unsaved
  const pending = useRef(null); // { exerciseId, detector, startedAt, received }
  const saveRef = useRef(saveReading);
  saveRef.current = saveReading;

  const exerciseId = timer?.kind === 'exercise' ? timer.itemId : null;
  const active = Boolean(exerciseId) && timerStatus === 'running' && supported && permission === 'granted';

  // Sends the unsaved part of the current reading. keepalive lets it finish while the page closes.
  const flush = useCallback((keepalive = false) => {
    const current = pending.current;
    if (!current) return;
    const durationSeconds = Math.round((Date.now() - current.startedAt) / 1000);
    const steps = current.detector.steps;
    current.detector.reset();
    current.startedAt = Date.now();
    if (!current.received || durationSeconds < MIN_SECONDS_TO_SAVE) return;
    const body = { exerciseId: current.exerciseId, steps, durationSeconds, clientDay: localDay() };
    if (keepalive) {
      fetch('/api/sensor-readings', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
    } else {
      saveRef.current(body).catch(() => {});
    }
  }, []);

  // A new timer (or a different activity) starts a fresh session count.
  useEffect(() => { setSessionSteps(0); }, [timer?.id]);

  useEffect(() => {
    if (!active) return;
    const detector = new StepDetector();
    pending.current = { exerciseId, detector, startedAt: Date.now(), received: false };
    setStatus('ready');
    const onMotion = event => {
      const a = event.accelerationIncludingGravity;
      // Desktop browsers may fire the event with null values: that is "no sensor", not data.
      if (!a || ![a.x, a.y, a.z].every(Number.isFinite)) return;
      if (!pending.current.received) { pending.current.received = true; setStatus('counting'); }
      if (detector.push(a.x, a.y, a.z, event.timeStamp)) setSessionSteps(s => s + 1);
    };
    const noData = setTimeout(() => { if (!pending.current?.received) setStatus('no-data'); }, NO_DATA_AFTER_MS);
    const onHide = () => { if (document.visibilityState === 'hidden') flush(true); };
    window.addEventListener('devicemotion', onMotion);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      clearTimeout(noData);
      window.removeEventListener('devicemotion', onMotion);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      flush(false);
      pending.current = null;
      setStatus(current => (current === 'counting' ? 'ready' : current));
    };
  }, [active, exerciseId, flush]);

  // iOS only allows the permission prompt from a tap, so this is wired to a button.
  const requestPermission = useCallback(async () => {
    try {
      const result = await window.DeviceMotionEvent.requestPermission();
      setPermission(result);
      setStatus(result === 'granted' ? 'ready' : 'denied');
    } catch {
      setPermission('denied');
      setStatus('denied');
    }
  }, []);

  return { status, sessionSteps, requestPermission, tracking: active };
}
