import { useDashboard } from "../../context/DashboardContext";

function MoodTracker() {
  const { wellness, updateMood } = useDashboard();

  const moods = [
    {
      label: "Great",
      emoji: "😄",
      value: "great",
      quote:
        "Keep that positive energy going — you're building momentum.",
    },
    {
      label: "Good",
      emoji: "🙂",
      value: "good",
      quote:
        "Small progress still moves you forward.",
    },
    {
      label: "Okay",
      emoji: "😐",
      value: "okay",
      quote:
        "You do not need a perfect day to make meaningful progress.",
    },
    {
      label: "Low",
      emoji: "😕",
      value: "low",
      quote:
        "Be gentle with yourself today. One small step is enough.",
    },
    {
      label: "Stressed",
      emoji: "😣",
      value: "stressed",
      quote:
        "Focus on what you can control, one task at a time.",
    },
  ];

  const selectedMood = moods.find(
    (mood) => mood.value === wellness?.mood
  );

  return (
    <article className="wellness-panel mood-panel">

      <div className="wellness-panel-top">
        <div>
          <span className="wellness-kicker">
            DAILY MOOD
          </span>

          <h2>How are you feeling?</h2>

          <p>
            Take a quick moment to check in
            with yourself.
          </p>
        </div>

        <div className="wellness-top-icon">
          🌿
        </div>
      </div>

      <div className="modern-mood-grid">

        {moods.map((mood) => {
          const selected =
            wellness?.mood === mood.value;

          return (
            <button
              key={mood.value}
              type="button"
              className={
                selected
                  ? "modern-mood-button selected"
                  : "modern-mood-button"
              }
              onClick={() =>
                updateMood(mood.value)
              }
              aria-pressed={selected}
            >
              <span className="modern-mood-emoji">
                {mood.emoji}
              </span>

              <span>
                {mood.label}
              </span>
            </button>
          );
        })}

      </div>

      {selectedMood ? (
        <div className="modern-mood-result">

          <div className="modern-mood-result-left">

            <div className="modern-result-emoji">
              {selectedMood.emoji}
            </div>

            <div>
              <span className="result-caption">
                TODAY'S MOOD
              </span>

              <h3>
                {selectedMood.label}
              </h3>
            </div>

          </div>

          <div className="modern-quote-box">
            <span className="quote-mark">
              “
            </span>

            <p>
              {selectedMood.quote}
            </p>
          </div>

          <div className="modern-recorded-status">
            <span>✓</span>
            Mood recorded
          </div>

        </div>
      ) : (
        <div className="modern-empty-message">
          Select a mood to see your daily
          wellbeing message.
        </div>
      )}

    </article>
  );
}

export default MoodTracker;