import { useDashboard } from "../../context/DashboardContext";

function MoodSelector() {
  const { mood, updateMood } = useDashboard();

  const moods = [
    {
      emoji: "😫",
      label: "Very Stressed",
    },
    {
      emoji: "😔",
      label: "Sad",
    },
    {
      emoji: "😐",
      label: "Neutral",
    },
    {
      emoji: "🙂",
      label: "Good",
    },
    {
      emoji: "😄",
      label: "Happy",
    },
  ];

  return (
    <div className="mood-selector">
      <h3>How are you feeling?</h3>

      <p className="mood-description">
        Select the mood that best describes you today.
      </p>

      <div
        className="mood-options"
        role="group"
        aria-label="Select your mood"
      >
        {moods.map((item) => (
          <button
            key={item.emoji}
            type="button"
            className={`mood-button ${
              mood === item.emoji ? "selected" : ""
            }`}
            onClick={() => updateMood(item.emoji)}
            aria-label={item.label}
            aria-pressed={mood === item.emoji}
            title={item.label}
          >
            <span className="mood-emoji">
              {item.emoji}
            </span>
          </button>
        ))}
      </div>

      <p className="selected-mood">
        Current mood: <strong>{mood}</strong>
      </p>
    </div>
  );
}

export default MoodSelector;