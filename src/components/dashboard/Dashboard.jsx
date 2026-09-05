import Layout from "../components/layout/Layout";

function Dashboard() {
  const userName = "Student";

  return (
    <Layout>
      <section className="dashboard-page">
        <div className="dashboard-header">
          <p className="page-eyebrow">STUDENT WELLNESS DASHBOARD</p>

          <h1>Good afternoon, {userName} 👋</h1>

          <p className="dashboard-description">
            Track your study progress and take care of your wellbeing.
            Small actions today create better habits tomorrow.
          </p>
        </div>

        <section className="dashboard-stats">
          <article className="stat-card">
            <div className="stat-icon">📚</div>

            <div>
              <p>Tasks Completed</p>
              <h2>0 / 0</h2>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">🔥</div>

            <div>
              <p>Current Streak</p>
              <h2>0 Days</h2>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">💧</div>

            <div>
              <p>Water Intake</p>
              <h2>0 / 8 Cups</h2>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">🎯</div>

            <div>
              <p>Focus Time</p>
              <h2>0 Minutes</h2>
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card balance-card">
            <div className="card-heading">
              <div>
                <p className="page-eyebrow">TODAY</p>
                <h2>Your Balance Score</h2>
              </div>

              <span className="card-icon">⚖️</span>
            </div>

            <div className="balance-content">
              <div
                className="balance-circle"
                role="img"
                aria-label="Balance score 0 percent"
              >
                <span>0%</span>
              </div>

              <div className="balance-text">
                <h3>Just getting started</h3>

                <p>
                  Complete study tasks and wellness activities to improve
                  your daily balance score.
                </p>
              </div>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="card-heading">
              <div>
                <p className="page-eyebrow">FOCUS</p>
                <h2>Pomodoro Timer</h2>
              </div>

              <span className="card-icon">🍅</span>
            </div>

            <div className="focus-placeholder">
              <h3>25:00</h3>

              <p>Ready for your next focus session?</p>

              <button
                type="button"
                className="primary-button"
              >
                Start Focus Session
              </button>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="card-heading">
              <div>
                <p className="page-eyebrow">STUDY</p>
                <h2>Today's Tasks</h2>
              </div>

              <button
                type="button"
                className="text-button"
              >
                Add Task
              </button>
            </div>

            <div className="empty-state">
              <span className="empty-icon">📋</span>

              <h3>No tasks yet</h3>

              <p>
                Add your first study task and start making progress.
              </p>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="card-heading">
              <div>
                <p className="page-eyebrow">WELLNESS</p>
                <h2>Daily Check-in</h2>
              </div>

              <span className="card-icon">🌱</span>
            </div>

            <div className="wellness-items">
              <div className="wellness-item">
                <span>😊</span>

                <div>
                  <h3>How are you feeling?</h3>
                  <p>Record your mood for today.</p>
                </div>
              </div>

              <div className="wellness-item">
                <span>💧</span>

                <div>
                  <h3>Water intake</h3>
                  <p>0 of 8 cups completed.</p>
                </div>
              </div>

              <div className="wellness-item">
                <span>😴</span>

                <div>
                  <h3>Sleep</h3>
                  <p>Log how many hours you slept.</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </section>
    </Layout>
  );
}

export default Dashboard;