 import { useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/layout/Layout";
import AddTask from "../components/tasks/AddTask";
import TaskCard from "../components/tasks/TaskCard";
import FocusTimer from "../components/tasks/FocusTimer";
import AddExercise from "../components/exercise/AddExercise";
import ExerciseCard from "../components/exercise/ExerciseCard";
import MoodTracker from "../components/wellness/MoodTracker";
import WaterTracker from "../components/wellness/WaterTracker";

import { useDashboard } from "../context/DashboardContext";

function Dashboard() {
  const {
    tasks,
    exercises,
    streak,
    loading,
    error,
    statistics,
    scheduledSessions = [],
    addFocusTime,
    addExerciseTime,
    updateScheduledSession,
  } = useDashboard();

  const [showTaskModal, setShowTaskModal] =
    useState(false);

  const [showExerciseModal, setShowExerciseModal] =
    useState(false);

  // Stores either a study task or exercise
  const [selectedSession, setSelectedSession] =
    useState(null);

  // =========================
  // START STUDY FOCUS
  // =========================

  function handleStartFocus(task) {
    setSelectedSession({
      ...task,
      sessionType: "study",
    });
  }

  // =========================
  // START EXERCISE FOCUS
  // =========================

  function handleStartExercise(exercise) {
    setSelectedSession({
      ...exercise,
      sessionType: "exercise",
    });
  }

  // =========================
  // START CALENDAR SESSION
  // =========================

  function handleStartScheduledSession(calendarSession) {
    if (!calendarSession) return;

    if (calendarSession.type === "study") {
      const linkedTask = tasks.find(
        (task) =>
          task.id === calendarSession.linkedItemId
      );

      if (!linkedTask) return;

      setSelectedSession({
        ...linkedTask,
        sessionType: "study",
        calendarSessionId: calendarSession.id,
      });

      return;
    }

    const linkedExercise = exercises.find(
      (exercise) =>
        exercise.id === calendarSession.linkedItemId
    );

    if (!linkedExercise) return;

    setSelectedSession({
      ...linkedExercise,
      sessionType: "exercise",
      calendarSessionId: calendarSession.id,
    });
  }

  // =========================
  // COMPLETE SESSION
  // =========================

  function handleSessionComplete(session, minutes) {
    if (!session) return;

    const completedMinutes =
      Number(minutes) > 0
        ? Number(minutes)
        : 1;

    // STUDY
    if (session.sessionType === "study") {
      addFocusTime(
        session.id,
        completedMinutes
      );
    }

    // EXERCISE
    if (session.sessionType === "exercise") {
      addExerciseTime(
        session.id,
        completedMinutes
      );
    }

    if (session.calendarSessionId) {
      updateScheduledSession(
        session.calendarSessionId,
        { completed: true }
      );
    }

    setSelectedSession(null);
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <section className="dashboard-page">
          <div className="empty-state">
            <h2>
              Loading your dashboard...
            </h2>

            <p>
              Please wait while we load your
              dashboard data.
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <Layout>
        <section className="dashboard-page">
          <div className="empty-state">
            <h2>
              Something went wrong
            </h2>

            <p>{error}</p>
          </div>
        </section>
      </Layout>
    );
  }

  // =========================
  // STATISTICS
  // =========================

  const {
    totalTasks = 0,
    completedTasks = 0,
    totalExercises = 0,
    completedExercises = 0,
    focusTime = 0,
    exerciseTime = 0,
    balanceScore = 0,
    streak: statisticsStreak = 0,
  } = statistics || {};

  const safeBalanceScore =
    Number(balanceScore) || 0;

  const safeFocusTime =
    Number(focusTime) || 0;

  const safeExerciseTime =
    Number(exerciseTime) || 0;

  const safeStreak =
    Number(statisticsStreak) ||
    Number(streak) ||
    0;

  function getTodayKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatSessionTime(time) {
    if (!time) return "";

    const [hourText, minute] =
      time.split(":");

    const hour = Number(hourText);
    const suffix =
      hour >= 12 ? "PM" : "AM";

    const displayHour =
      hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
  }

  const todayKey = getTodayKey();

  const todaysScheduledSessions =
    scheduledSessions
      .filter(
        (session) =>
          session.date === todayKey
      )
      .sort((a, b) =>
        a.startTime.localeCompare(
          b.startTime
        )
      );

  return (
    <Layout>
      <section className="dashboard-page">

        {/* HEADER */}

        <div className="dashboard-header">
          <p className="page-eyebrow">
            STUDENT WELLNESS DASHBOARD
          </p>

          <h1>
            Welcome back, Student 👋
          </h1>

          <p className="dashboard-description">
            Track your study progress and take
            care of your wellbeing.
          </p>
        </div>


        {/* STATISTICS */}

        <section className="dashboard-stats">

          <article className="stat-card">
            <div className="stat-icon">
              📚
            </div>

            <div>
              <p>
                Tasks Completed
              </p>

              <h2>
                {completedTasks} / {totalTasks}
              </h2>
            </div>
          </article>


          <article className="stat-card">
            <div className="stat-icon">
              💪
            </div>

            <div>
              <p>
                Exercise
              </p>

              <h2>
                {completedExercises} /{" "}
                {totalExercises}
              </h2>
            </div>
          </article>


          <article className="stat-card">
            <div className="stat-icon">
              🎯
            </div>

            <div>
              <p>
                Study Focus
              </p>

              <h2>
                {safeFocusTime} min
              </h2>
            </div>
          </article>


          <article className="stat-card">
            <div className="stat-icon">
              🔥
            </div>

            <div>
              <p>
                Current Streak
              </p>

              <h2>
                {safeStreak} Days
              </h2>
            </div>
          </article>


          <article className="stat-card">
            <div className="stat-icon">
              ⚖️
            </div>

            <div>
              <p>
                Balance Score
              </p>

              <h2>
                {safeBalanceScore}%
              </h2>
            </div>
          </article>

        </section>


        {/* TODAY'S CALENDAR SCHEDULE */}

        <section className="dashboard-schedule-section">

          <div className="dashboard-schedule-heading">
            <div>
              <p className="page-eyebrow">
                YOUR SCHEDULE
              </p>

              <h2>
                Today's Sessions
              </h2>

              <p>
                Study and exercise sessions
                scheduled from your calendar.
              </p>
            </div>

            <Link
              to="/calendar"
              className="text-button dashboard-calendar-link"
            >
              View Calendar →
            </Link>
          </div>

          {todaysScheduledSessions.length === 0 ? (

            <div className="dashboard-schedule-empty">
              <span>🗓️</span>

              <div>
                <h3>
                  Nothing scheduled today
                </h3>

                <p>
                  Add a study or exercise session
                  from your calendar.
                </p>
              </div>

              <Link
                to="/calendar"
                className="primary-button"
              >
                Schedule Session
              </Link>
            </div>

          ) : (

            <div className="dashboard-schedule-list">

              {todaysScheduledSessions.map(
                (session) => (

                  <article
                    key={session.id}
                    className={`dashboard-session-card ${session.type}`}
                  >

                    <div className="dashboard-session-icon">
                      {session.type === "study"
                        ? "📚"
                        : "💪"}
                    </div>

                    <div className="dashboard-session-content">

                      <div className="dashboard-session-meta">
                        <span>
                          {session.type === "study"
                            ? "Study session"
                            : "Exercise session"}
                        </span>

                        <span>
                          {formatSessionTime(
                            session.startTime
                          )}
                        </span>
                      </div>

                      <h3>
                        {session.title}
                      </h3>

                      <p>
                        {session.duration} min
                        {session.linkedItemId
                          ? " · Linked to Dashboard"
                          : ""}
                      </p>

                    </div>

                    <button
                      type="button"
                      className={
                        session.completed
                          ? "dashboard-session-start completed"
                          : "dashboard-session-start"
                      }
                      onClick={() =>
                        handleStartScheduledSession(
                          session
                        )
                      }
                      disabled={
                        session.completed ||
                        !session.linkedItemId
                      }
                    >
                      {session.completed
                        ? "✓ Completed"
                        : session.type === "study"
                        ? "🍅 Start Focus"
                        : "💪 Exercise Focus"}
                    </button>

                  </article>
                )
              )}

            </div>

          )}

        </section>


        {/* DASHBOARD GRID */}

        <section className="dashboard-grid">


          {/* BALANCE SCORE */}

          <article className="dashboard-card balance-card">

            <div className="card-heading">

              <div>
                <p className="page-eyebrow">
                  TODAY
                </p>

                <h2>
                  Your Balance Score
                </h2>
              </div>

              <span className="card-icon">
                ⚖️
              </span>

            </div>


            <div className="balance-content">

              <div
                className="balance-circle"
                role="img"
                aria-label={`Balance score ${safeBalanceScore} percent`}
                style={{
                  background: `conic-gradient(
                    var(--primary-purple)
                    ${safeBalanceScore * 3.6}deg,
                    var(--light-lilac)
                    0deg
                  )`,
                }}
              >
                <span>
                  {safeBalanceScore}%
                </span>
              </div>


              <div className="balance-text">

                <h3>
                  {safeBalanceScore >= 80
                    ? "Excellent work!"
                    : safeBalanceScore >= 50
                    ? "Great progress!"
                    : "Keep going!"}
                </h3>

                <p>
                  Study, exercise, mood and
                  water activities contribute
                  to your daily balance score.
                </p>

              </div>

            </div>

          </article>


          {/* SHARED TIMER */}

          <FocusTimer
            selectedSession={selectedSession}
            onComplete={handleSessionComplete}
          />


          {/* STUDY TASKS */}

          <article className="dashboard-card tasks-card">

            <div className="card-heading">

              <div>

                <p className="page-eyebrow">
                  STUDY
                </p>

                <h2>
                  Today's Tasks
                </h2>

              </div>


              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setShowTaskModal(true)
                }
              >
                + Add Task
              </button>

            </div>


            <div className="task-list">

              {tasks.length === 0 ? (

                <div className="empty-state">

                  <span className="empty-icon">
                    📋
                  </span>

                  <h3>
                    No tasks yet
                  </h3>

                  <p>
                    Add your first task to get
                    started.
                  </p>

                </div>

              ) : (

                tasks.map((task) => (

                  <TaskCard
                    key={task.id}
                    task={task}
                    onStartFocus={
                      handleStartFocus
                    }
                  />

                ))

              )}

            </div>

          </article>


          {/* EXERCISE */}

          <article className="dashboard-card tasks-card">

            <div className="card-heading">

              <div>

                <p className="page-eyebrow">
                  FITNESS
                </p>

                <h2>
                  Today's Exercise
                </h2>

              </div>


              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setShowExerciseModal(true)
                }
              >
                + Add Exercise
              </button>

            </div>


            <p className="exercise-total">
              Total exercise today:{" "}

              <strong>
                {safeExerciseTime} min
              </strong>
            </p>


            <div className="task-list">

              {exercises.length === 0 ? (

                <div className="empty-state">

                  <span className="empty-icon">
                    💪
                  </span>

                  <h3>
                    No exercises yet
                  </h3>

                  <p>
                    Add an exercise to get
                    started.
                  </p>

                </div>

              ) : (

                exercises.map((exercise) => (

                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onStartFocus={
                      handleStartExercise
                    }
                  />

                ))

              )}

            </div>

          </article>

        </section>


        {/* DAILY WELLNESS */}

        <section className="wellness-dashboard-section">

          <div className="wellness-section-heading">

            <p className="page-eyebrow">
              DAILY WELLNESS
            </p>

            <h2>
              Take care of yourself
            </h2>

            <p>
              Track your mood and hydration
              alongside your study and fitness goals.
            </p>

          </div>

          <div className="wellness-dashboard-grid">

            <MoodTracker />

            <WaterTracker />

          </div>

        </section>


        {/* ADD TASK MODAL */}

        {showTaskModal && (

          <AddTask
            onClose={() =>
              setShowTaskModal(false)
            }
          />

        )}


        {/* ADD EXERCISE MODAL */}

        {showExerciseModal && (

          <AddExercise
            onClose={() =>
              setShowExerciseModal(false)
            }
          />

        )}

      </section>
    </Layout>
  );
}

export default Dashboard;