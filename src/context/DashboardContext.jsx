import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, localDay } from "../services/api";
import { useAuth } from "./AuthContext";
const DashboardContext = createContext(null);
export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [tasks,setTasks] = useState([]);
  const [exercises,setExercises] = useState([]);
  const [wellness,setWellness] = useState({mood:'',water:0});
  const [scheduledSessions,setScheduledSessions] = useState([]);
  const [streak,setStreak] = useState(0);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const queue = useRef(Promise.resolve());
  const owner = useRef(user?.id);
  owner.current = user?.id;
  async function refresh() {
    const actor = user?.id;
    const data = await api(`/dashboard?day=${localDay()}`);
    if (owner.current !== actor) return;
    setTasks(data.tasks);
    setExercises(data.exercises);
    setWellness(data.wellness);
    setScheduledSessions(data.scheduledSessions);
    setStreak(data.streak);
    setError('');
  }
  useEffect(() => {
    if (!user) {
      setTasks([]); setExercises([]); setWellness({mood:'',water:0}); setScheduledSessions([]); setStreak(0); setError('');
      return;
    }
    let cancelled=false;
    setLoading(true); setError('');
    api(`/dashboard?day=${localDay()}`).then(data => {
      if(cancelled) return;
      setTasks(data.tasks); setExercises(data.exercises); setWellness(data.wellness);
      setScheduledSessions(data.scheduledSessions); setStreak(data.streak);
    }).catch(e => { if(!cancelled) setError(e.message); }).finally(()=>{if(!cancelled) setLoading(false);});
    return () => {cancelled=true;};
  },[user?.id]);
  // Latest wellness values, so queued water clicks build on each other rather than on stale state.
  const wellnessRef = useRef(wellness);
  wellnessRef.current = wellness;

  // Serialize mutations so rapid clicks cannot overwrite newer server state.
  // request() returns the API call to make; the dashboard is reloaded afterwards.
  function mutate(request) {
    const actor=user?.id;
    queue.current = queue.current.catch(()=>{}).then(async()=>{
      if(!actor || owner.current!==actor) throw new Error('Account changed. Please try again.');
      await request();
      if(owner.current!==actor) return;
      await refresh(); setError('');
    }).catch(e=>{if(owner.current===actor) setError(e.message); throw e;});
    // Event handlers do not await actions; the visible error is retained in context.
    queue.current.catch(()=>{});
    return queue.current;
  }
  const send = (path, method, body) => () => api(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  const withDay = body => ({ ...body, clientDay: localDay() });

  // Study tasks (REST: /api/tasks)
  const addTask = data => mutate(send('/tasks', 'POST', data));
  const updateTask = (id, data) => mutate(send(`/tasks/${id}`, 'PATCH', data));
  const deleteTask = id => mutate(send(`/tasks/${id}`, 'DELETE'));
  const toggleTaskComplete = id => mutate(send(`/tasks/${id}`, 'PATCH', withDay({ completed: !tasks.find(t => t.id === id)?.completed })));
  const addFocusTime = (id, minutes) => mutate(send(`/tasks/${id}/progress`, 'POST', withDay({ minutes })));
  // Exercises (REST: /api/exercises)
  const addExercise = data => mutate(send('/exercises', 'POST', data));
  const updateExercise = (id, data) => mutate(send(`/exercises/${id}`, 'PATCH', data));
  const deleteExercise = id => mutate(send(`/exercises/${id}`, 'DELETE'));
  const toggleExerciseComplete = id => mutate(send(`/exercises/${id}`, 'PATCH', withDay({ completed: !exercises.find(e => e.id === id)?.completed })));
  const addExerciseTime = (id, minutes) => mutate(send(`/exercises/${id}/progress`, 'POST', withDay({ minutes })));
  const recordSteps = (exerciseId, steps, durationSeconds) => mutate(send('/sensor-readings', 'POST', withDay({ exerciseId, steps, durationSeconds })));
  // Daily wellness (REST: /api/wellness/:day)
  const updateMood = mood => mutate(send(`/wellness/${localDay()}`, 'PATCH', { mood }));
  const changeWater = delta => mutate(() => api(`/wellness/${localDay()}`, { method: 'PATCH', body: JSON.stringify({ water: Math.max(0, Math.min(8, (Number(wellnessRef.current.water) || 0) + delta)) }) }));
  const addWater = () => changeWater(1);
  const removeWater = () => changeWater(-1);
  // Calendar sessions (REST: /api/sessions)
  const addScheduledSession = data => mutate(send('/sessions', 'POST', withDay(data)));
  const updateScheduledSession = (id, data) => mutate(send(`/sessions/${id}`, 'PATCH', withDay(data)));
  const deleteScheduledSession = id => mutate(send(`/sessions/${id}`, 'DELETE'));
  // =========================
  // DASHBOARD STATISTICS
  // =========================

  const statistics = useMemo(() => {
    // -------------------------
    // TASK STATISTICS
    // -------------------------

    const totalTasks =
      tasks.length;

    const completedTasks =
      tasks.filter(
        (task) => task.completed
      ).length;

    const focusTime =
      tasks.reduce(
        (total, task) =>
          total +
          (
            Number(
              task.completedFocusMinutes
            ) || 0
          ),
        0
      );

    const totalRequiredFocus =
      tasks.reduce(
        (total, task) =>
          total +
          (
            Number(
              task.focusMinutes
            ) || 0
          ),
        0
      );

    // -------------------------
    // EXERCISE STATISTICS
    // -------------------------

    const totalExercises =
      exercises.length;

    const completedExercises =
      exercises.filter(
        (exercise) =>
          exercise.completed
      ).length;

    const exerciseTime =
      exercises.reduce(
        (total, exercise) =>
          total +
          (
            Number(
              exercise.completedExerciseMinutes
            ) || 0
          ),
        0
      );

    const totalRequiredExercise =
      exercises.reduce(
        (total, exercise) =>
          total +
          (
            Number(
              exercise.exerciseMinutes
            ) || 0
          ),
        0
      );

    // =========================
    // BALANCE SCORE
    // =========================

    /*
      Each main area contributes:

      Study = 25%
      Exercise = 25%
      Mood = 25%
      Water = 25%
    */

    // -------------------------
    // STUDY SCORE
    // -------------------------

    const studyScore =
      totalRequiredFocus > 0
        ? Math.min(
            (
              focusTime /
              totalRequiredFocus
            ) * 25,
            25
          )
        : 0;

    // -------------------------
    // EXERCISE SCORE
    // -------------------------

    const exerciseScore =
      totalRequiredExercise > 0
        ? Math.min(
            (
              exerciseTime /
              totalRequiredExercise
            ) * 25,
            25
          )
        : 0;

    // -------------------------
    // MOOD SCORE
    // -------------------------

    const moodScore =
      wellness.mood
        ? 25
        : 0;

    // -------------------------
    // WATER SCORE
    // -------------------------

    const waterAmount =
      Number(
        wellness.water
      ) || 0;

    const waterScore =
      Math.min(
        (
          waterAmount / 8
        ) * 25,
        25
      );

    // -------------------------
    // FINAL BALANCE SCORE
    // -------------------------

    const balanceScore =
      Math.min(
        100,
        Math.round(
          studyScore +
            exerciseScore +
            moodScore +
            waterScore
        )
      );

    return {
      // Tasks
      totalTasks,
      completedTasks,

      focusTime,

      totalRequiredFocus,

      // Exercises
      totalExercises,

      completedExercises,

      exerciseTime,

      totalRequiredExercise,

      // Wellness
      water: waterAmount,

      mood:
        wellness.mood || "",

      // Scores
      studyScore,

      exerciseScore,

      moodScore,

      waterScore,

      balanceScore,

      // General
      streak,
    };
  }, [
    tasks,
    exercises,
    wellness,
    streak,
  ]);

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {
    refresh,
    // Data
    tasks,

    exercises,

    wellness,

    scheduledSessions,

    streak,

    loading,

    error,

    statistics,

    // Task functions
    addTask,

    deleteTask,

    toggleTaskComplete,

    addFocusTime,

    updateTask,

    // Exercise functions
    addExercise,

    deleteExercise,

    toggleExerciseComplete,

    addExerciseTime,

    updateExercise,

    recordSteps,

    // Wellness functions
    updateMood,

    addWater,

    removeWater,

    // Calendar functions
    addScheduledSession,
    updateScheduledSession,
    deleteScheduledSession,
  };

  return (
    <DashboardContext.Provider
      value={value}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context =
    useContext(DashboardContext);

  if (!context) {
    throw new Error(
      "useDashboard must be used inside DashboardProvider"
    );
  }

  return context;
}
