import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getDashboardData } from "../services/dashboardService";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  // =========================
  // TASK STATE
  // =========================

  const [tasks, setTasks] = useState([]);

  // =========================
  // EXERCISE STATE
  // =========================

  const [exercises, setExercises] = useState([]);

  // =========================
  // WELLNESS STATE
  // =========================

  const [wellness, setWellness] = useState({
    mood: "",
    water: 0,
  });

  // =========================
  // SCHEDULED SESSION STATE
  // =========================

  const [scheduledSessions, setScheduledSessions] = useState(() => {
    try {
      const savedSessions = localStorage.getItem(
        "balanceboard-scheduled-sessions"
      );

      return savedSessions
        ? JSON.parse(savedSessions)
        : [];
    } catch {
      return [];
    }
  });

  // =========================
  // GENERAL STATE
  // =========================

  const [streak, setStreak] = useState(7);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardData();

        // Load tasks
        setTasks(
          Array.isArray(data.tasks)
            ? data.tasks
            : []
        );

        // Load exercises
        setExercises(
          Array.isArray(data.exercises)
            ? data.exercises
            : []
        );

        // Load wellness
        setWellness(
          data.wellness || {
            mood: "",
            water: 0,
          }
        );

        // Load streak
        setStreak(
          Number(data.streak) || 0
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // =========================
  // SAVE SCHEDULED SESSIONS
  // =========================

  useEffect(() => {
    localStorage.setItem(
      "balanceboard-scheduled-sessions",
      JSON.stringify(scheduledSessions)
    );
  }, [scheduledSessions]);

  // =========================
  // ADD TASK
  // =========================

  function addTask(taskData) {
    const newTask = {
      id: Date.now(),

      title:
        taskData.title?.trim() ||
        "Untitled Task",

      category:
        taskData.category ||
        "Study",

      description:
        taskData.description?.trim() ||
        "",

      focusMinutes:
        Number(taskData.focusMinutes) > 0
          ? Number(taskData.focusMinutes)
          : Number(taskData.estimatedMinutes) > 0
          ? Number(taskData.estimatedMinutes)
          : 25,

      completedFocusMinutes: 0,

      completed: false,
    };

    setTasks((currentTasks) => [
      ...currentTasks,
      newTask,
    ]);
  }

  // =========================
  // DELETE TASK
  // =========================

  function deleteTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.id !== taskId
      )
    );
  }

  // =========================
  // TOGGLE TASK COMPLETION
  // =========================

  function toggleTaskComplete(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  }

  // =========================
  // ADD TASK FOCUS TIME
  // =========================

  function addFocusTime(taskId, minutes) {
    const minutesToAdd =
      Number(minutes) || 0;

    if (minutesToAdd <= 0) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const currentFocus =
          Number(
            task.completedFocusMinutes
          ) || 0;

        const targetFocus =
          Number(task.focusMinutes) || 25;

        const newFocus =
          Math.min(
            currentFocus + minutesToAdd,
            targetFocus
          );

        return {
          ...task,

          completedFocusMinutes:
            newFocus,

          completed:
            newFocus >= targetFocus
              ? true
              : task.completed,
        };
      })
    );
  }

  // =========================
  // ADD EXERCISE
  // =========================

  function addExercise(exerciseData) {
    const newExercise = {
      id: Date.now(),

      title:
        exerciseData.title?.trim() ||
        "Untitled Exercise",

      category:
        exerciseData.category ||
        "Exercise",

      description:
        exerciseData.description?.trim() ||
        "",

      exerciseMinutes:
        Number(
          exerciseData.exerciseMinutes
        ) > 0
          ? Number(
              exerciseData.exerciseMinutes
            )
          : Number(
              exerciseData.estimatedMinutes
            ) > 0
          ? Number(
              exerciseData.estimatedMinutes
            )
          : 30,

      completedExerciseMinutes: 0,

      completed: false,
    };

    setExercises((currentExercises) => [
      ...currentExercises,
      newExercise,
    ]);
  }

  // =========================
  // DELETE EXERCISE
  // =========================

  function deleteExercise(exerciseId) {
    setExercises((currentExercises) =>
      currentExercises.filter(
        (exercise) =>
          exercise.id !== exerciseId
      )
    );
  }

  // =========================
  // TOGGLE EXERCISE
  // =========================

  function toggleExerciseComplete(
    exerciseId
  ) {
    setExercises((currentExercises) =>
      currentExercises.map(
        (exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                completed:
                  !exercise.completed,
              }
            : exercise
      )
    );
  }

  // =========================
  // ADD EXERCISE TIME
  // =========================

  function addExerciseTime(
    exerciseId,
    minutes
  ) {
    const minutesToAdd =
      Number(minutes) || 0;

    if (minutesToAdd <= 0) {
      return;
    }

    setExercises((currentExercises) =>
      currentExercises.map(
        (exercise) => {
          if (
            exercise.id !== exerciseId
          ) {
            return exercise;
          }

          const currentTime =
            Number(
              exercise.completedExerciseMinutes
            ) || 0;

          const targetTime =
            Number(
              exercise.exerciseMinutes
            ) || 30;

          const newTime =
            Math.min(
              currentTime + minutesToAdd,
              targetTime
            );

          return {
            ...exercise,

            completedExerciseMinutes:
              newTime,

            completed:
              newTime >= targetTime
                ? true
                : exercise.completed,
          };
        }
      )
    );
  }

  // =========================
  // UPDATE MOOD
  // =========================

  function updateMood(mood) {
    setWellness(
      (currentWellness) => ({
        ...currentWellness,
        mood,
      })
    );
  }

  // =========================
  // ADD WATER
  // =========================

  function addWater() {
    setWellness(
      (currentWellness) => ({
        ...currentWellness,

        water: Math.min(
          (
            Number(
              currentWellness.water
            ) || 0
          ) + 1,
          8
        ),
      })
    );
  }

  // =========================
  // REMOVE WATER
  // =========================

  function removeWater() {
    setWellness(
      (currentWellness) => ({
        ...currentWellness,

        water: Math.max(
          (
            Number(
              currentWellness.water
            ) || 0
          ) - 1,
          0
        ),
      })
    );
  }

  // =========================
  // SCHEDULE SESSION
  // =========================

  function addScheduledSession(sessionData) {
    const sessionId = Date.now();

    const type =
      sessionData.type === "exercise"
        ? "exercise"
        : "study";

    let linkedItemId =
      sessionData.linkedItemId || null;

    const title =
      sessionData.title?.trim() ||
      "Untitled Session";

    const duration =
      Number(sessionData.duration) > 0
        ? Number(sessionData.duration)
        : type === "exercise"
        ? 30
        : 25;

    // If the calendar session is not linked to an
    // existing task/exercise, automatically create one.
    // This makes Calendar -> Dashboard update instantly.
    if (!linkedItemId) {
      linkedItemId = sessionId + 1;

      if (type === "study") {
        const newTask = {
          id: linkedItemId,
          title,
          category: "Study",
          description:
            "Scheduled from BalanceBoard Calendar.",
          focusMinutes: duration,
          completedFocusMinutes: 0,
          completed: false,
          createdFromCalendar: true,
        };

        setTasks((currentTasks) => [
          ...currentTasks,
          newTask,
        ]);
      } else {
        const newExercise = {
          id: linkedItemId,
          title,
          category: "Exercise",
          description:
            "Scheduled from BalanceBoard Calendar.",
          exerciseMinutes: duration,
          completedExerciseMinutes: 0,
          completed: false,
          createdFromCalendar: true,
        };

        setExercises((currentExercises) => [
          ...currentExercises,
          newExercise,
        ]);
      }
    }

    const newSession = {
      id: sessionId,
      type,
      title,
      date: sessionData.date || "",
      startTime:
        sessionData.startTime || "09:00",
      duration,
      linkedItemId,
      completed: false,
    };

    setScheduledSessions((currentSessions) =>
      [...currentSessions, newSession].sort(
        (a, b) =>
          `${a.date}T${a.startTime}`.localeCompare(
            `${b.date}T${b.startTime}`
          )
      )
    );

    return newSession;
  }

  function updateScheduledSession(sessionId, updates) {
    const currentSession =
      scheduledSessions.find(
        (session) => session.id === sessionId
      );

    const nextType =
      updates.type ||
      currentSession?.type ||
      "study";

    const linkedItemId =
      updates.linkedItemId ||
      currentSession?.linkedItemId ||
      null;

    const nextTitle =
      updates.title?.trim() ||
      currentSession?.title ||
      "Untitled Session";

    const nextDuration =
      Number(updates.duration) > 0
        ? Number(updates.duration)
        : Number(currentSession?.duration) ||
          (nextType === "exercise" ? 30 : 25);

    setScheduledSessions((currentSessions) =>
      currentSessions
        .map((session) =>
          session.id === sessionId
            ? {
                ...session,
                ...updates,
                type: nextType,
                title: nextTitle,
                duration: nextDuration,
                linkedItemId,
              }
            : session
        )
        .sort((a, b) =>
          `${a.date}T${a.startTime}`.localeCompare(
            `${b.date}T${b.startTime}`
          )
        )
    );

    // Keep the linked Dashboard card in sync.
    if (linkedItemId) {
      if (nextType === "study") {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === linkedItemId
              ? {
                  ...task,
                  title: nextTitle,
                  focusMinutes: nextDuration,
                }
              : task
          )
        );
      } else {
        setExercises((currentExercises) =>
          currentExercises.map((exercise) =>
            exercise.id === linkedItemId
              ? {
                  ...exercise,
                  title: nextTitle,
                  exerciseMinutes: nextDuration,
                }
              : exercise
          )
        );
      }
    }
  }

  function deleteScheduledSession(sessionId) {
    setScheduledSessions((currentSessions) =>
      currentSessions.filter(
        (session) => session.id !== sessionId
      )
    );
  }

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

    // Exercise functions
    addExercise,

    deleteExercise,

    toggleExerciseComplete,

    addExerciseTime,

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