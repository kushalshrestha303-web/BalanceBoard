import { useState } from "react";
import { createPortal } from "react-dom";
import { useDashboard } from "../../context/DashboardContext";
import AddTask from "./AddTask";

function TaskCard({ task, onStartFocus }) {
  const {
    toggleTaskComplete,
    deleteTask,
  } = useDashboard();
  const [editing, setEditing] = useState(false);

  const targetMinutes =
    Number(task.focusMinutes) || 25;

  const completedMinutes =
    Number(task.completedFocusMinutes) || 0;

  const progress =
    targetMinutes > 0
      ? Math.min(
          Math.round(
            (completedMinutes / targetMinutes) * 100
          ),
          100
        )
      : 0;

  const isCompleted =
    Boolean(task.completed);

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
            📚 {task.category || "Study"}
          </span>

          <h3>{task.title}</h3>
        </div>

        <div className="activity-card-tools">
          <button
            type="button"
            className="activity-delete-button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${task.title}`}
            title="Edit task"
          >
            ✏️
          </button>
          <button
            type="button"
            className="activity-delete-button"
            onClick={() => deleteTask(task.id)}
            aria-label={`Delete ${task.title}`}
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* DESCRIPTION */}

      {task.description && (
        <p className="activity-description">
          {task.description}
        </p>
      )}

      {/* PROGRESS */}

      <div className="activity-progress-section">

        <div className="activity-progress-heading">
          <span>Focus progress</span>

          <strong>
            {Math.round(completedMinutes * 10) / 10} / {targetMinutes} min
          </strong>
        </div>

        <div
          className="activity-progress-track"
          role="progressbar"
          aria-label={`Focus progress for ${task.title}`}
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
            toggleTaskComplete(task.id)
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
            onStartFocus(task)
          }
          disabled={isCompleted}
        >
          <span className="activity-button-icon">
            🍅
          </span>

          <span>
            Focus
          </span>
        </button>

      </div>

      {/* Rendered on <body> so the modal is not clipped by the card */}
      {editing && createPortal(<AddTask task={task} onClose={() => setEditing(false)} />, document.body)}
    </article>
  );
}

export default TaskCard;