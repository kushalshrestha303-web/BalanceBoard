import Layout from "../components/layout/Layout";
import { useDashboard } from "../context/DashboardContext";

function Analytics() {
  const {
    tasks = [],
    exercises = [],
    streak = 0,
    loading,
    error,
    statistics,
  } = useDashboard();

  /* =========================
     STATISTICS
  ========================= */

  const {
    totalTasks = 0,
    completedTasks = 0,
    totalExercises = 0,
    completedExercises = 0,
    focusTime = 0,
    exerciseTime = 0,
    balanceScore = 0,
    totalRequiredFocus = 0,
    totalRequiredExercise = 0,
    streak: statisticsStreak = 0,
  } = statistics || {};

  const safeFocusTime =
    Number(focusTime) || 0;

  const safeExerciseTime =
    Number(exerciseTime) || 0;

  const safeBalanceScore =
    Number(balanceScore) || 0;

  const safeStreak =
    Number(statisticsStreak) ||
    Number(streak) ||
    0;

  const safeRequiredFocus =
    Number(totalRequiredFocus) || 0;

  const safeRequiredExercise =
    Number(totalRequiredExercise) || 0;

  /* =========================
     PROGRESS
  ========================= */

  const taskProgress =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;

  const focusProgress =
    safeRequiredFocus > 0
      ? Math.min(
          Math.round(
            (safeFocusTime /
              safeRequiredFocus) *
              100
          ),
          100
        )
      : 0;

  const exerciseProgress =
    safeRequiredExercise > 0
      ? Math.min(
          Math.round(
            (safeExerciseTime /
              safeRequiredExercise) *
              100
          ),
          100
        )
      : 0;

  /* =========================
     PRODUCTIVITY SCORE
  ========================= */

  const productivityScore =
    Math.round(
      (
        focusProgress +
        taskProgress +
        exerciseProgress +
        safeBalanceScore
      ) / 4
    );

  /* =========================
     ACTIVITY BREAKDOWN
  ========================= */

  const totalTrackedTime =
    safeFocusTime + safeExerciseTime;

  const studyPercentage =
    totalTrackedTime > 0
      ? Math.round(
          (safeFocusTime /
            totalTrackedTime) *
            100
        )
      : 0;

  const exercisePercentage =
    totalTrackedTime > 0
      ? Math.round(
          (safeExerciseTime /
            totalTrackedTime) *
            100
        )
      : 0;

  /* =========================
     FORMAT MINUTES
  ========================= */

  function formatMinutes(minutes) {
    const value =
      Number(minutes) || 0;

    const hours =
      Math.floor(value / 60);

    const remainingMinutes =
      value % 60;

    if (hours === 0) {
      return `${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  /* =========================
     WEEKLY HISTORY

     Historical data is not
     stored yet.

     We show 0 instead of
     fake sample data.
  ========================= */

  const weeklyData = [
    {
      day: "Mon",
      hours: "0h",
      height: 0,
    },
    {
      day: "Tue",
      hours: "0h",
      height: 0,
    },
    {
      day: "Wed",
      hours: "0h",
      height: 0,
    },
    {
      day: "Thu",
      hours: "0h",
      height: 0,
    },
    {
      day: "Fri",
      hours: "0h",
      height: 0,
    },
    {
      day: "Sat",
      hours: "0h",
      height: 0,
    },
    {
      day: "Sun",
      hours: "0h",
      height: 0,
    },
  ];

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <Layout>
        <section className="dashboard-page">
          <div className="empty-state">
            <h2>
              Loading analytics...
            </h2>

            <p>
              Please wait while we load
              your productivity data.
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  /* =========================
     ERROR
  ========================= */

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

  return (
    <Layout>
      <section className="dashboard-page analytics-page">

        {/* =====================
            HEADER
        ===================== */}

        <div className="dashboard-header">

          <p className="page-eyebrow">
            YOUR INSIGHTS
          </p>

          <div className="analytics-header-row">

            <div>
              <h1>
                Analytics
              </h1>

              <p className="dashboard-description">
                Track your productivity,
                focus, and daily balance.
                Understand your habits and
                improve your performance.
              </p>
            </div>

            <div className="analytics-period-selector">

              <button
                type="button"
                className="period-button active"
              >
                Week
              </button>

              <button
                type="button"
                className="period-button"
                disabled
              >
                Month
              </button>

              <button
                type="button"
                className="period-button"
                disabled
              >
                Year
              </button>

            </div>

          </div>

        </div>

        {/* =====================
            TOP STATISTICS
        ===================== */}

        <section className="dashboard-stats">

          {/* FOCUS */}

          <article className="stat-card">

            <div className="stat-icon">
              ⏱
            </div>

            <div>

              <p>
                Focus Time
              </p>

              <h2>
                {formatMinutes(
                  safeFocusTime
                )}
              </h2>

              <span className="analytics-positive">
                {focusProgress}% of focus goal
              </span>

            </div>

          </article>

          {/* TASKS */}

          <article className="stat-card">

            <div className="stat-icon">
              ✓
            </div>

            <div>

              <p>
                Tasks Completed
              </p>

              <h2>
                {completedTasks} /{" "}
                {totalTasks}
              </h2>

              <span className="analytics-positive">
                {taskProgress}% completed
              </span>

            </div>

          </article>

          {/* STREAK */}

          <article className="stat-card">

            <div className="stat-icon">
              🔥
            </div>

            <div>

              <p>
                Current Streak
              </p>

              <h2>
                {safeStreak}{" "}
                {safeStreak === 1
                  ? "day"
                  : "days"}
              </h2>

              <span className="analytics-muted">
                Keep it going!
              </span>

            </div>

          </article>

          {/* BALANCE */}

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

              <span className="analytics-positive">
                Current balance
              </span>

            </div>

          </article>

        </section>

        {/* =====================
            FIRST ROW
        ===================== */}

        <section className="analytics-main-grid">

          {/* WEEKLY PRODUCTIVITY */}

          <article className="dashboard-card analytics-weekly-card">

            <div className="card-heading">

              <div>

                <p className="page-eyebrow">
                  THIS WEEK
                </p>

                <h2>
                  Weekly Productivity
                </h2>

                <p className="analytics-card-description">
                  Your focused hours
                  throughout the week
                </p>

              </div>

              <div className="analytics-total-hours">

                <strong>
                  {formatMinutes(
                    safeFocusTime
                  )}
                </strong>

                <span>
                  Current Focus
                </span>

              </div>

            </div>

            <div className="analytics-chart">

              <div className="chart-axis">

                <span>6h</span>
                <span>4h</span>
                <span>2h</span>
                <span>0h</span>

              </div>

              <div className="bar-chart">

                {weeklyData.map(
                  (item) => (

                    <div
                      className="bar-column"
                      key={item.day}
                    >

                      <span className="bar-value">
                        {item.hours}
                      </span>

                      <div className="bar-track">

                        <div
                          className="bar-fill"
                          style={{
                            height:
                              `${item.height}%`,
                          }}
                        />

                      </div>

                      <strong className="bar-day">
                        {item.day}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </div>

            <p
              style={{
                marginTop: "16px",
                color: "var(--muted-text)",
                fontSize: "12px",
              }}
            >
              Weekly history will appear
              here when daily activity
              tracking is available.
            </p>

          </article>

          {/* PRODUCTIVITY SCORE */}

          <article className="dashboard-card">

            <div className="card-heading">

              <div>

                <p className="page-eyebrow">
                  PERFORMANCE
                </p>

                <h2>
                  Productivity Score
                </h2>

                <p className="analytics-card-description">
                  Your overall performance
                </p>

              </div>

            </div>

            <div
              className="analytics-score-circle"
              style={{
                background:
                  `conic-gradient(
                    var(--primary-purple)
                    ${productivityScore}%,
                    var(--light-lilac)
                    ${productivityScore}%
                  )`,
              }}
            >

              <div className="analytics-score-inner">

                <strong>
                  {productivityScore}%
                </strong>

                <span>
                  {productivityScore >= 80
                    ? "Great job!"
                    : productivityScore >= 50
                    ? "Good progress"
                    : "Keep going!"}
                </span>

              </div>

            </div>

            <div className="analytics-score-list">

              {/* FOCUS */}

              <div className="analytics-score-item">

                <div>

                  <span>
                    Focus
                  </span>

                  <strong>
                    {focusProgress}%
                  </strong>

                </div>

                <div className="analytics-progress">

                  <span
                    style={{
                      width:
                        `${focusProgress}%`,
                    }}
                  />

                </div>

              </div>

              {/* TASKS */}

              <div className="analytics-score-item">

                <div>

                  <span>
                    Tasks
                  </span>

                  <strong>
                    {taskProgress}%
                  </strong>

                </div>

                <div className="analytics-progress">

                  <span
                    style={{
                      width:
                        `${taskProgress}%`,
                    }}
                  />

                </div>

              </div>

              {/* EXERCISE */}

              <div className="analytics-score-item">

                <div>

                  <span>
                    Exercise
                  </span>

                  <strong>
                    {exerciseProgress}%
                  </strong>

                </div>

                <div className="analytics-progress">

                  <span
                    style={{
                      width:
                        `${exerciseProgress}%`,
                    }}
                  />

                </div>

              </div>

              {/* BALANCE */}

              <div className="analytics-score-item">

                <div>

                  <span>
                    Balance
                  </span>

                  <strong>
                    {safeBalanceScore}%
                  </strong>

                </div>

                <div className="analytics-progress">

                  <span
                    style={{
                      width:
                        `${Math.min(
                          safeBalanceScore,
                          100
                        )}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </article>

        </section>

        {/* =====================
            SECOND ROW
        ===================== */}

        <section className="analytics-two-column">

          {/* ACTIVITY BREAKDOWN */}

          <article className="dashboard-card">

            <div className="card-heading">

              <div>

                <p className="page-eyebrow">
                  ACTIVITY
                </p>

                <h2>
                  Activity Breakdown
                </h2>

                <p className="analytics-card-description">
                  How you spend your
                  tracked productive time
                </p>

              </div>

            </div>

            <div className="analytics-activity-list">

              <div className="analytics-activity-item">

                <div>

                  <span className="analytics-activity-icon">
                    📚
                  </span>

                  <strong>
                    Study
                  </strong>

                </div>

                <strong>
                  {studyPercentage}%
                </strong>

              </div>

              <div className="analytics-activity-item">

                <div>

                  <span className="analytics-activity-icon">
                    🏃
                  </span>

                  <strong>
                    Exercise
                  </strong>

                </div>

                <strong>
                  {exercisePercentage}%
                </strong>

              </div>

              <div className="analytics-activity-item">

                <div>

                  <span className="analytics-activity-icon">
                    ✓
                  </span>

                  <strong>
                    Task Completion
                  </strong>

                </div>

                <strong>
                  {taskProgress}%
                </strong>

              </div>

              <div className="analytics-activity-item">

                <div>

                  <span className="analytics-activity-icon">
                    ⚖️
                  </span>

                  <strong>
                    Balance
                  </strong>

                </div>

                <strong>
                  {safeBalanceScore}%
                </strong>

              </div>

            </div>

          </article>

          {/* DAILY GOALS */}

          <article className="dashboard-card">

            <div className="card-heading">

              <div>

                <p className="page-eyebrow">
                  CURRENT PROGRESS
                </p>

                <h2>
                  Goals
                </h2>

                <p className="analytics-card-description">
                  Your progress toward
                  your current goals
                </p>

              </div>

            </div>

            <div className="analytics-goals">

              {/* FOCUS */}

              <div className="analytics-goal">

                <div>

                  <strong>
                    🍅 Focus Time
                  </strong>

                  <span>
                    {formatMinutes(
                      safeFocusTime
                    )}{" "}
                    /{" "}
                    {formatMinutes(
                      safeRequiredFocus
                    )}
                  </span>

                </div>

                <div className="analytics-progress">

                  <span
                    style={{
                      width:
                        `${focusProgress}%`,
                    }}
                  />

                </div>

              </div>

              {/* TASKS */}

              <div className="analytics-goal">

                <div>

                  <strong>
                    ✓ Complete Tasks
                  </strong>

                  <span>
                    {completedTasks} /{" "}
                    {totalTasks}
                  </span>

                </div>

                <div className="analytics-progress">

                  <span
                    style={{
                      width:
                        `${taskProgress}%`,
                    }}
                  />

                </div>

              </div>

              {/* EXERCISE */}

              <div className="analytics-goal">

                <div>

                  <strong>
                    🏃 Exercise
                  </strong>

                  <span>
                    {formatMinutes(
                      safeExerciseTime
                    )}{" "}
                    /{" "}
                    {formatMinutes(
                      safeRequiredExercise
                    )}
                  </span>

                </div>

                <div className="analytics-progress">

                  <span
                    style={{
                      width:
                        `${exerciseProgress}%`,
                    }}
                  />

                </div>

              </div>

            </div>

            <div className="analytics-goal-message">

              <span>
                ✨
              </span>

              <p>
                {taskProgress === 100 &&
                focusProgress === 100 &&
                exerciseProgress === 100
                  ? "Excellent work! You reached your current productivity goals."
                  : "Keep going! Every completed activity improves your progress and balance."}
              </p>

            </div>

          </article>

        </section>

        {/* =====================
            ACTIVITY SUMMARY
        ===================== */}

        <article className="dashboard-card analytics-recent-card">

          <div className="card-heading">

            <div>

              <p className="page-eyebrow">
                CURRENT DATA
              </p>

              <h2>
                Activity Summary
              </h2>

              <p className="analytics-card-description">
                Your current BalanceBoard
                activity
              </p>

            </div>

          </div>

          <div className="analytics-recent-list">

            {/* FOCUS */}

            <div className="analytics-recent-item">

              <div className="analytics-recent-icon">
                🍅
              </div>

              <div className="analytics-recent-info">

                <h3>
                  Focus sessions
                </h3>

                <p>
                  You have completed{" "}
                  {formatMinutes(
                    safeFocusTime
                  )}{" "}
                  from{" "}
                  {formatMinutes(
                    safeRequiredFocus
                  )}{" "}
                  of required focus time.
                </p>

              </div>

              <span className="analytics-recent-time">
                {focusProgress}% goal
              </span>

            </div>

            {/* TASKS */}

            <div className="analytics-recent-item">

              <div className="analytics-recent-icon">
                ✓
              </div>

              <div className="analytics-recent-info">

                <h3>
                  Study tasks
                </h3>

                <p>
                  {completedTasks} completed
                  from {totalTasks} total
                  tasks.
                </p>

              </div>

              <span className="analytics-recent-time">
                {tasks.length}{" "}
                {tasks.length === 1
                  ? "task"
                  : "tasks"}
              </span>

            </div>

            {/* EXERCISE */}

            <div className="analytics-recent-item">

              <div className="analytics-recent-icon">
                🏃
              </div>

              <div className="analytics-recent-info">

                <h3>
                  Exercise activity
                </h3>

                <p>
                  {completedExercises} completed
                  from {totalExercises} exercises,
                  with{" "}
                  {formatMinutes(
                    safeExerciseTime
                  )}{" "}
                  tracked.
                </p>

              </div>

              <span className="analytics-recent-time">
                {exercises.length}{" "}
                {exercises.length === 1
                  ? "exercise"
                  : "exercises"}
              </span>

            </div>

            {/* BALANCE */}

            <div className="analytics-recent-item">

              <div className="analytics-recent-icon">
                ⚖️
              </div>

              <div className="analytics-recent-info">

                <h3>
                  Current balance
                </h3>

                <p>
                  Your current balance
                  score is{" "}
                  {safeBalanceScore}%.
                </p>

              </div>

              <span className="analytics-recent-time">
                {safeStreak}{" "}
                {safeStreak === 1
                  ? "day"
                  : "days"}{" "}
                streak
              </span>

            </div>

          </div>

        </article>

      </section>
    </Layout>
  );
}

export default Analytics;