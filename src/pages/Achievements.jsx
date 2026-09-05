import { useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import { useDashboard } from "../context/DashboardContext";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getLevelInfo(xp) {
  const levels = [
    {
      level: 1,
      title: "Getting Started",
      icon: "🌱",
      minXp: 0,
      nextXp: 250,
    },
    {
      level: 2,
      title: "Habit Builder",
      icon: "📚",
      minXp: 250,
      nextXp: 500,
    },
    {
      level: 3,
      title: "Focused Learner",
      icon: "🎯",
      minXp: 500,
      nextXp: 750,
    },
    {
      level: 4,
      title: "Balanced Learner",
      icon: "⚖️",
      minXp: 750,
      nextXp: 1000,
    },
    {
      level: 5,
      title: "Momentum Maker",
      icon: "🔥",
      minXp: 1000,
      nextXp: 1500,
    },
    {
      level: 6,
      title: "Balance Master",
      icon: "💎",
      minXp: 1500,
      nextXp: null,
    },
  ];

  let currentLevel = levels[0];

  for (const level of levels) {
    if (xp >= level.minXp) {
      currentLevel = level;
    }
  }

  const nextLevel = levels.find(
    (level) => level.level === currentLevel.level + 1
  );

  const levelProgress =
    currentLevel.nextXp === null
      ? 100
      : clamp(
          Math.round(
            ((xp - currentLevel.minXp) /
              (currentLevel.nextXp -
                currentLevel.minXp)) *
              100
          ),
          0,
          100
        );

  const xpRemaining =
    currentLevel.nextXp === null
      ? 0
      : Math.max(currentLevel.nextXp - xp, 0);

  return {
    currentLevel,
    nextLevel,
    levelProgress,
    xpRemaining,
    levels,
  };
}

function Achievements() {
  const {
    tasks = [],
    exercises = [],
    wellness = {},
    streak = 0,
    statistics = {},
    scheduledSessions = [],
  } = useDashboard();

  const [activeFilter, setActiveFilter] =
    useState("all");

  const completedTasks =
    statistics.completedTasks ??
    tasks.filter((task) => task.completed).length;

  const completedExercises =
    statistics.completedExercises ??
    exercises.filter((exercise) => exercise.completed).length;

  const focusTime =
    Number(statistics.focusTime) || 0;

  const exerciseTime =
    Number(statistics.exerciseTime) || 0;

  const balanceScore =
    Number(statistics.balanceScore) || 0;

  const water =
    Number(statistics.water ?? wellness.water) || 0;

  const mood =
    statistics.mood || wellness.mood || "";

  const safeStreak =
    Number(statistics.streak ?? streak) || 0;

  const completedScheduledSessions =
    scheduledSessions.filter(
      (session) => session.completed
    ).length;

  const achievements = useMemo(
    () => [
      {
        id: "first-step",
        category: "study",
        icon: "📚",
        title: "First Step",
        description:
          "Complete your first study task.",
        current: completedTasks,
        target: 1,
        unit: "task",
        xp: 50,
      },
      {
        id: "study-starter",
        category: "study",
        icon: "🧠",
        title: "Study Starter",
        description:
          "Complete 5 study tasks.",
        current: completedTasks,
        target: 5,
        unit: "tasks",
        xp: 100,
      },
      {
        id: "focus-apprentice",
        category: "study",
        icon: "🎯",
        title: "Focus Apprentice",
        description:
          "Complete 60 minutes of focused study.",
        current: focusTime,
        target: 60,
        unit: "min",
        xp: 100,
      },
      {
        id: "deep-worker",
        category: "study",
        icon: "🍅",
        title: "Deep Worker",
        description:
          "Complete 300 minutes of focused study.",
        current: focusTime,
        target: 300,
        unit: "min",
        xp: 200,
      },
      {
        id: "focus-master",
        category: "study",
        icon: "🏅",
        title: "Focus Master",
        description:
          "Complete 600 minutes of focused study.",
        current: focusTime,
        target: 600,
        unit: "min",
        xp: 300,
      },

      {
        id: "get-moving",
        category: "fitness",
        icon: "💪",
        title: "Get Moving",
        description:
          "Complete your first exercise.",
        current: completedExercises,
        target: 1,
        unit: "exercise",
        xp: 50,
      },
      {
        id: "active-five",
        category: "fitness",
        icon: "🏃",
        title: "Active Five",
        description:
          "Complete 5 exercise activities.",
        current: completedExercises,
        target: 5,
        unit: "exercises",
        xp: 100,
      },
      {
        id: "fitness-builder",
        category: "fitness",
        icon: "⚡",
        title: "Fitness Builder",
        description:
          "Complete 120 minutes of exercise.",
        current: exerciseTime,
        target: 120,
        unit: "min",
        xp: 150,
      },

      {
        id: "hydration-starter",
        category: "wellness",
        icon: "💧",
        title: "Hydration Starter",
        description:
          "Track your first cup of water.",
        current: water,
        target: 1,
        unit: "cup",
        xp: 25,
      },
      {
        id: "hydration-hero",
        category: "wellness",
        icon: "🌊",
        title: "Hydration Hero",
        description:
          "Reach your 8 cup hydration goal.",
        current: water,
        target: 8,
        unit: "cups",
        xp: 75,
      },
      {
        id: "check-in",
        category: "wellness",
        icon: "🌿",
        title: "Check In",
        description:
          "Record your mood today.",
        current: mood ? 1 : 0,
        target: 1,
        unit: "check-in",
        xp: 25,
      },

      {
        id: "planner",
        category: "planning",
        icon: "🗓️",
        title: "Planner",
        description:
          "Schedule your first study or exercise session.",
        current: scheduledSessions.length,
        target: 1,
        unit: "session",
        xp: 50,
      },
      {
        id: "plan-execute",
        category: "planning",
        icon: "✅",
        title: "Plan & Execute",
        description:
          "Complete 5 scheduled sessions.",
        current: completedScheduledSessions,
        target: 5,
        unit: "sessions",
        xp: 150,
      },

      {
        id: "finding-balance",
        category: "balance",
        icon: "⚖️",
        title: "Finding Balance",
        description:
          "Reach a 50% Balance Score.",
        current: balanceScore,
        target: 50,
        unit: "%",
        xp: 75,
      },
      {
        id: "balanced-day",
        category: "balance",
        icon: "✨",
        title: "Balanced Day",
        description:
          "Reach an 80% Balance Score.",
        current: balanceScore,
        target: 80,
        unit: "%",
        xp: 150,
      },
      {
        id: "perfect-balance",
        category: "balance",
        icon: "💯",
        title: "Perfect Balance",
        description:
          "Reach a 100% Balance Score.",
        current: balanceScore,
        target: 100,
        unit: "%",
        xp: 250,
      },

      {
        id: "consistent",
        category: "streak",
        icon: "🔥",
        title: "Getting Consistent",
        description:
          "Maintain a 3 day streak.",
        current: safeStreak,
        target: 3,
        unit: "days",
        xp: 75,
      },
      {
        id: "week-warrior",
        category: "streak",
        icon: "🏆",
        title: "Week Warrior",
        description:
          "Maintain a 7 day streak.",
        current: safeStreak,
        target: 7,
        unit: "days",
        xp: 150,
      },
    ],
    [
      completedTasks,
      completedExercises,
      focusTime,
      exerciseTime,
      water,
      mood,
      scheduledSessions.length,
      completedScheduledSessions,
      balanceScore,
      safeStreak,
    ]
  );

  const achievementsWithState =
    achievements.map((achievement) => {
      const safeCurrent = Number(
        achievement.current
      );

      const current =
        Number.isFinite(safeCurrent)
          ? safeCurrent
          : 0;

      const progress = clamp(
        Math.round(
          (current / achievement.target) * 100
        ),
        0,
        100
      );

      return {
        ...achievement,
        current,
        progress,
        unlocked:
          current >= achievement.target,
      };
    });

  const unlockedAchievements =
    achievementsWithState.filter(
      (achievement) => achievement.unlocked
    );

  const totalXp =
    unlockedAchievements.reduce(
      (total, achievement) =>
        total + achievement.xp,
      0
    );

  const {
    currentLevel,
    nextLevel,
    levelProgress,
    xpRemaining,
    levels,
  } = getLevelInfo(totalXp);

  const completionPercent =
    Math.round(
      (unlockedAchievements.length /
        achievementsWithState.length) *
        100
    );

  const filteredAchievements =
    activeFilter === "all"
      ? achievementsWithState
      : achievementsWithState.filter(
          (achievement) =>
            achievement.category === activeFilter
        );

  const featuredAchievement =
    achievementsWithState.find(
      (achievement) =>
        achievement.id === "week-warrior"
    ) ||
    achievementsWithState[0];

  const filters = [
    { id: "all", label: "All" },
    { id: "study", label: "📚 Study" },
    { id: "fitness", label: "💪 Fitness" },
    { id: "wellness", label: "🌿 Wellness" },
    { id: "planning", label: "🗓 Planning" },
    { id: "balance", label: "⚖️ Balance" },
    { id: "streak", label: "🔥 Streak" },
  ];

  return (
    <Layout>
      <section className="achievements-page">
        <div className="dashboard-header achievements-header">
          <div>
            <p className="page-eyebrow">
              YOUR PROGRESS
            </p>

            <h1>Achievements</h1>

            <p className="dashboard-description">
              Turn your study, fitness, planning,
              and wellness habits into progress.
            </p>
          </div>
        </div>

        <section className="achievement-hero">
          <div className="achievement-level-icon">
            {currentLevel.icon}
          </div>

          <div className="achievement-level-copy">
            <span className="achievement-small-label">
              LEVEL {currentLevel.level}
            </span>

            <h2>{currentLevel.title}</h2>

            <p>
              Every healthy habit moves you closer
              to your next level.
            </p>

            <div className="achievement-xp-row">
              <strong>{totalXp} XP</strong>

              <span>
                {nextLevel
                  ? `${xpRemaining} XP until Level ${nextLevel.level}`
                  : "Highest level reached"}
              </span>
            </div>

            <div className="achievement-level-progress">
              <div
                className="achievement-level-progress-fill"
                style={{
                  width: `${levelProgress}%`,
                }}
              />
            </div>
          </div>

          <div className="achievement-hero-stats">
            <div>
              <strong>
                {unlockedAchievements.length}
              </strong>
              <span>Unlocked</span>
            </div>

            <div>
              <strong>
                {achievementsWithState.length -
                  unlockedAchievements.length}
              </strong>
              <span>Remaining</span>
            </div>

            <div>
              <strong>{safeStreak}</strong>
              <span>Day Streak</span>
            </div>
          </div>
        </section>

        <section className="achievement-overview-grid">
          <article className="achievement-overview-card">
            <span>🏆</span>
            <div>
              <p>Achievements</p>
              <h3>
                {unlockedAchievements.length} /{" "}
                {achievementsWithState.length}
              </h3>
              <small>
                {completionPercent}% complete
              </small>
            </div>
          </article>

          <article className="achievement-overview-card">
            <span>⭐</span>
            <div>
              <p>XP Earned</p>
              <h3>{totalXp}</h3>
              <small>
                Level {currentLevel.level} progress
              </small>
            </div>
          </article>

          <article className="achievement-overview-card">
            <span>🗓️</span>
            <div>
              <p>Scheduled Sessions</p>
              <h3>
                {completedScheduledSessions} /{" "}
                {scheduledSessions.length}
              </h3>
              <small>completed</small>
            </div>
          </article>

          <article className="achievement-overview-card">
            <span>⚖️</span>
            <div>
              <p>Balance Score</p>
              <h3>{balanceScore}%</h3>
              <small>today</small>
            </div>
          </article>
        </section>

        <section className="achievement-featured">
          <div className="achievement-featured-glow" />

          <div className="achievement-featured-icon">
            {featuredAchievement.icon}
          </div>

          <div className="achievement-featured-content">
            <span className="achievement-small-label">
              FEATURED ACHIEVEMENT
            </span>

            <h2>
              {featuredAchievement.title}
            </h2>

            <p>
              {featuredAchievement.description}
            </p>

            <div className="achievement-featured-progress-row">
              <span>Progress</span>
              <strong>
                {Math.min(
                  featuredAchievement.current,
                  featuredAchievement.target
                )}{" "}
                / {featuredAchievement.target}{" "}
                {featuredAchievement.unit}
              </strong>
            </div>

            <div className="achievement-featured-bar">
              <div
                className="achievement-featured-bar-fill"
                style={{
                  width: `${featuredAchievement.progress}%`,
                }}
              />
            </div>

            <div
              className={
                featuredAchievement.unlocked
                  ? "achievement-featured-status unlocked"
                  : "achievement-featured-status"
              }
            >
              {featuredAchievement.unlocked
                ? "✓ Achievement unlocked"
                : `${Math.max(
                    featuredAchievement.target -
                      featuredAchievement.current,
                    0
                  )} ${featuredAchievement.unit} to go`}
            </div>
          </div>

          <div className="achievement-featured-xp">
            +{featuredAchievement.xp} XP
          </div>
        </section>

        <section className="achievement-library-section">
          <div className="achievement-section-heading">
            <div>
              <p className="page-eyebrow">
                BADGE COLLECTION
              </p>
              <h2>All Achievements</h2>
              <p>
                Keep building habits to unlock
                every badge.
              </p>
            </div>
          </div>

          <div className="achievement-filter-row">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={
                  activeFilter === filter.id
                    ? "achievement-filter active"
                    : "achievement-filter"
                }
                onClick={() =>
                  setActiveFilter(filter.id)
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="achievement-grid-modern">
            {filteredAchievements.map(
              (achievement) => (
                <article
                  key={achievement.id}
                  className={
                    achievement.unlocked
                      ? "achievement-card-modern unlocked"
                      : "achievement-card-modern locked"
                  }
                >
                  <div className="achievement-card-top">
                    <div className="achievement-badge-icon">
                      {achievement.unlocked
                        ? achievement.icon
                        : "🔒"}
                    </div>

                    <span className="achievement-xp-chip">
                      +{achievement.xp} XP
                    </span>
                  </div>

                  <span className="achievement-category-label">
                    {achievement.category}
                  </span>

                  <h3>{achievement.title}</h3>

                  <p>{achievement.description}</p>

                  <div className="achievement-card-progress-copy">
                    <span>Progress</span>
                    <strong>
                      {Math.min(
                        achievement.current,
                        achievement.target
                      )}{" "}
                      / {achievement.target}{" "}
                      {achievement.unit}
                    </strong>
                  </div>

                  <div className="achievement-card-progress">
                    <div
                      className="achievement-card-progress-fill"
                      style={{
                        width: `${achievement.progress}%`,
                      }}
                    />
                  </div>

                  <div
                    className={
                      achievement.unlocked
                        ? "achievement-card-status unlocked"
                        : "achievement-card-status"
                    }
                  >
                    {achievement.unlocked ? (
                      <>
                        <span>✓</span>
                        Unlocked
                      </>
                    ) : (
                      <>
                        <span>🔒</span>
                        {Math.max(
                          achievement.target -
                            achievement.current,
                          0
                        )}{" "}
                        {achievement.unit} remaining
                      </>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        <section className="achievement-level-roadmap">
          <div className="achievement-section-heading">
            <div>
              <p className="page-eyebrow">
                LEVEL ROADMAP
              </p>
              <h2>Your BalanceBoard Journey</h2>
              <p>
                Unlock achievements to collect XP
                and progress through the levels.
              </p>
            </div>
          </div>

          <div className="achievement-level-list">
            {levels.map((level) => {
              const reached =
                totalXp >= level.minXp;

              const current =
                currentLevel.level === level.level;

              return (
                <article
                  key={level.level}
                  className={`achievement-level-item${
                    reached ? " reached" : ""
                  }${current ? " current" : ""}`}
                >
                  <div className="achievement-level-item-icon">
                    {level.icon}
                  </div>

                  <div>
                    <span>
                      Level {level.level}
                    </span>
                    <h3>{level.title}</h3>
                  </div>

                  <strong>
                    {level.minXp} XP
                  </strong>

                  {reached && (
                    <div className="achievement-level-check">
                      ✓
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </Layout>
  );
}

export default Achievements;
