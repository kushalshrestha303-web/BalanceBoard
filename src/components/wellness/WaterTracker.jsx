import { useDashboard } from "../../context/DashboardContext";

function WaterTracker() {
  const {
    wellness,
    addWater,
    removeWater,
  } = useDashboard();

  const WATER_GOAL = 8;

  const water =
    Math.min(
      Number(wellness?.water) || 0,
      WATER_GOAL
    );

  const percentage =
    Math.round(
      (water / WATER_GOAL) * 100
    );

  const remaining =
    WATER_GOAL - water;

  function getHydrationMessage() {
    if (water === 0) {
      return {
        icon: "💧",
        title: "Start your hydration",
        message:
          "A glass of water is a simple way to begin your day.",
      };
    }

    if (water <= 2) {
      return {
        icon: "🌱",
        title: "Good start",
        message:
          "Keep water nearby and take small sips regularly.",
      };
    }

    if (water <= 4) {
      return {
        icon: "✨",
        title: "You're building momentum",
        message:
          "Nice progress. Try another glass during your next break.",
      };
    }

    if (water <= 6) {
      return {
        icon: "💦",
        title: "Nearly there",
        message:
          "You're getting close to your daily hydration goal.",
      };
    }

    if (water === 7) {
      return {
        icon: "🙌",
        title: "One more cup",
        message:
          "You're almost there. One more cup completes today's goal.",
      };
    }

    return {
      icon: "🎉",
      title: "Goal completed",
      message:
        "Great work. You've completed your hydration goal for today.",
    };
  }

  const hydrationMessage =
    getHydrationMessage();

  return (
    <article className="wellness-panel water-panel">

      <div className="wellness-panel-top">

        <div>
          <span className="wellness-kicker">
            HYDRATION
          </span>

          <h2>Water Tracker</h2>

          <p>
            Keep your hydration visible
            throughout the day.
          </p>
        </div>

        <div className="wellness-top-icon">
          💧
        </div>

      </div>

      <div className="modern-water-main">

        <div
          className="modern-water-ring"
          style={{
            background: `conic-gradient(
              var(--primary-purple)
              ${percentage}%,
              var(--light-lilac)
              ${percentage}%
            )`,
          }}
        >
          <div className="modern-water-ring-inner">

            <strong>
              {water}
            </strong>

            <span>
              of {WATER_GOAL}
            </span>

            <small>
              cups
            </small>

          </div>
        </div>

        <div className="modern-water-info">

          <div className="modern-water-percentage">
            {percentage}%
          </div>

          <h3>
            Daily hydration
          </h3>

          <p>
            {water >= WATER_GOAL
              ? "Today's hydration goal is complete."
              : `${remaining} ${
                  remaining === 1
                    ? "cup"
                    : "cups"
                } remaining today.`}
          </p>

        </div>

      </div>

      <div className="modern-water-glasses">

        {Array.from({
          length: WATER_GOAL,
        }).map((_, index) => {

          const filled =
            index < water;

          return (
            <div
              key={index}
              className={
                filled
                  ? "modern-water-glass filled"
                  : "modern-water-glass"
              }
            >
              <span>
                {filled ? "💧" : ""}
              </span>
            </div>
          );
        })}

      </div>

      <div className="modern-water-actions">

        <button
          type="button"
          className="modern-water-remove"
          onClick={removeWater}
          disabled={water === 0}
        >
          −
          <span>Remove</span>
        </button>

        <button
          type="button"
          className="modern-water-add"
          onClick={addWater}
          disabled={water >= WATER_GOAL}
        >
          +
          <span>Add water</span>
        </button>

      </div>

      <div className="modern-hydration-tip">

        <div className="modern-tip-icon">
          {hydrationMessage.icon}
        </div>

        <div>
          <span className="result-caption">
            HYDRATION TIP
          </span>

          <h3>
            {hydrationMessage.title}
          </h3>

          <p>
            {hydrationMessage.message}
          </p>
        </div>

      </div>

      <p className="modern-water-note">
        8 cups is used as a simple BalanceBoard
        tracking goal. Individual hydration needs
        can vary.
      </p>

    </article>
  );
}

export default WaterTracker;