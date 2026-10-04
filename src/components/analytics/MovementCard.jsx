import { useEffect, useState } from "react";
import { api, localDay } from "../../services/api";
import { useDashboard } from "../../context/DashboardContext";

const DAYS_SHOWN = 7;

function lastDays(count) {
  const days = [];
  const d = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
    days.push(`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`);
  }
  return days;
}

// Steps counted by the phone's accelerometer during exercise sessions (GET /api/sensor-readings).
export default function MovementCard() {
  const { exercises } = useDashboard();
  const [readings, setReadings] = useState(null);
  const [error, setError] = useState("");
  const stepsKey = exercises.map((e) => `${e.id}:${e.steps}`).join(",");

  useEffect(() => {
    let cancelled = false;
    const days = lastDays(DAYS_SHOWN);
    api(`/sensor-readings?from=${days[0]}&to=${localDay()}`)
      .then((data) => { if (!cancelled) { setReadings(data); setError(""); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [stepsKey]);

  const days = lastDays(DAYS_SHOWN);
  const perDay = days.map((day) => ({
    day,
    steps: (readings || []).filter((r) => r.day === day).reduce((sum, r) => sum + r.value, 0),
  }));
  const weekSteps = perDay.reduce((sum, d) => sum + d.steps, 0);
  const seconds = (readings || []).reduce((sum, r) => sum + r.durationSeconds, 0);
  const cadence = seconds > 0 ? Math.round(weekSteps / (seconds / 60)) : 0;
  const max = Math.max(1, ...perDay.map((d) => d.steps));

  return (
    <article className="dashboard-card movement-card" aria-labelledby="movement-heading">
      <div className="card-heading">
        <div>
          <p className="page-eyebrow">ACCELEROMETER</p>
          <h2 id="movement-heading">Movement this week</h2>
          <p className="analytics-card-description">
            Steps counted by your phone during exercise timers.
          </p>
        </div>
      </div>

      {error && <p role="alert" className="form-error">Could not load movement data: {error}</p>}
      {!error && readings === null && <p>Loading movement data…</p>}
      {!error && readings !== null && (
        weekSteps === 0 ? (
          <p className="movement-empty">
            No steps recorded in the last {DAYS_SHOWN} days. Start an exercise timer on your phone to count steps.
          </p>
        ) : (
          <>
            <dl className="movement-stats">
              <div><dt>Steps (7 days)</dt><dd>{weekSteps.toLocaleString()}</dd></div>
              <div><dt>Tracked time</dt><dd>{seconds < 60 ? `${seconds} s` : `${Math.round(seconds / 60)} min`}</dd></div>
              <div><dt>Average cadence</dt><dd>{cadence} steps/min</dd></div>
            </dl>
            <ul className="movement-bars" aria-label="Steps per day">
              {perDay.map((d) => (
                <li key={d.day}>
                  <span className="movement-bar" style={{ height: `${Math.round((d.steps / max) * 100)}%` }} />
                  <span className="movement-day">{new Date(`${d.day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
                  <span className="sr-only">{d.steps} steps</span>
                </li>
              ))}
            </ul>
          </>
        )
      )}
    </article>
  );
}
