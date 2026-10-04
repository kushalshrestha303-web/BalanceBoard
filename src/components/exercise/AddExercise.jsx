import { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";

// Used for both creating an exercise and editing an existing one (when `exercise` is passed).
function AddExercise({ onClose, exercise = null }) {
  const { addExercise, updateExercise } = useDashboard();
  const editing = Boolean(exercise);

  const [formData, setFormData] = useState({
    title: exercise?.title ?? "",
    category: exercise?.category ?? "Cardio",
    description: exercise?.description ?? "",
    exerciseMinutes: exercise?.exerciseMinutes ?? 30,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    if (!formData.title.trim()) {
      setError("Please enter an exercise name.");
      return;
    }

    if (Number(formData.exerciseMinutes) <= 0) {
      setError(
        "Exercise duration must be greater than zero."
      );
      return;
    }

    setSaving(true);
    try {
    const data = {
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description,
      exerciseMinutes: Number(formData.exerciseMinutes),
    };
    if (editing) await updateExercise(exercise.id, data);
    else await addExercise(data);

    onClose();
    } catch(e) { setError(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay">
      <div
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-exercise-title"
      >
        <div className="modal-header">
          <div>
            <p className="page-eyebrow">
              {editing ? "EDIT EXERCISE" : "NEW EXERCISE"}
            </p>

            <h2 id="add-exercise-title">
              {editing ? "Edit exercise" : "Add Exercise"}
            </h2>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="exercise-title">
              Exercise name
            </label>

            <input
              id="exercise-title"
              name="title"
              type="text"
              placeholder="Example: Morning Run"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="exercise-category">
              Exercise category
            </label>

            <select
              id="exercise-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {editing && !["Cardio", "Strength", "Yoga", "Walking", "Cycling", "Other"].includes(exercise.category) && (
                <option value={exercise.category}>{exercise.category}</option>
              )}

              <option value="Cardio">
                🏃 Cardio
              </option>

              <option value="Strength">
                💪 Strength
              </option>

              <option value="Yoga">
                🧘 Yoga
              </option>

              <option value="Walking">
                🚶 Walking
              </option>

              <option value="Cycling">
                🚴 Cycling
              </option>

              <option value="Other">
                🌱 Other
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="exercise-description">
              Exercise note
            </label>

            <textarea
              id="exercise-description"
              name="description"
              rows="4"
              placeholder="Describe your exercise goal..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="exerciseMinutes">
              Exercise duration (minutes)
            </label>

            <input
              id="exerciseMinutes"
              name="exerciseMinutes"
              type="number"
              min="1"
              value={formData.exerciseMinutes}
              onChange={handleChange}
            />
          </div>

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
            disabled={saving}
              className="primary-button"
            >
              {editing ? "Save Changes" : "Add Exercise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExercise;