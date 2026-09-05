import { useDashboard } from "../../context/DashboardContext";

function ExerciseCard({
  exercise,
  onStartFocus,
}) {
  const {
    toggleExerciseComplete,
    deleteExercise,
  } = useDashboard();

  const targetMinutes =
    Number(exercise.exerciseMinutes) || 30;

  const completedMinutes =
    Number(
      exercise.completedExerciseMinutes
    ) || 0;

  const progress =
    targetMinutes > 0
      ? Math.min(
          Math.round(
            (completedMinutes / targetMinutes) *
              100
          ),
          100
        )
      : 0;

  const isCompleted =
    Boolean(exercise.completed);

  return (
    <article
      className={
        isCompleted
          ? "activity-card activity-card-completed"
          : "activity-card"
      }
    >

      {/* TOP */}

      <div className="activity-card-header">

        <div className="activity-card-heading">

          <span className="activity-category">
            💪 {exercise.category || "Exercise"}
          </span>

          <h3>
            {exercise.title}
          </h3>

        </div>

        <button
          type="button"
          className="activity-delete-button"
          onClick={() =>
            deleteExercise(exercise.id)
          }
          aria-label={`Delete ${exercise.title}`}
          title="Delete exercise"
        >
          🗑️
        </button>

      </div>

      {/* DESCRIPTION */}

      {exercise.description && (
        <p className="activity-description">
          {exercise.description}
        </p>
      )}

      {/* PROGRESS */}

      <div className="activity-progress-section">

        <div className="activity-progress-heading">

          <span>
            Exercise progress
          </span>

          <strong>
            {completedMinutes} / {targetMinutes} min
          </strong>

        </div>

        <div
          className="activity-progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax={targetMinutes}
          aria-valuenow={completedMinutes}
        >
          <div
            className="activity-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="activity-progress-footer">

          <span>
            {progress}% completed
          </span>

          {isCompleted && (
            <span className="activity-completed-label">
              ✓ Completed
            </span>
          )}

        </div>

      </div>

      {/* ACTIONS */}

      <div className="activity-actions">

        <button
          type="button"
          className={
            isCompleted
              ? "activity-complete-button completed"
              : "activity-complete-button"
          }
          onClick={() =>
            toggleExerciseComplete(
              exercise.id
            )
          }
        >
          <span className="activity-button-icon">
            {isCompleted ? "✓" : "○"}
          </span>

          <span>
            {isCompleted
              ? "Completed"
              : "Complete"}
          </span>
        </button>

        <button
          type="button"
          className="activity-focus-button"
          onClick={() =>
            onStartFocus(exercise)
          }
          disabled={isCompleted}
        >
          <span className="activity-button-icon">
            💪
          </span>

          <span>
            Exercise Focus
          </span>
        </button>

      </div>

    </article>
  );
}

export default ExerciseCard;