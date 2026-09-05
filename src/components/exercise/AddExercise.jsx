import { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";

function AddExercise({ onClose }) {
  const { addExercise } = useDashboard();

  const [formData, setFormData] = useState({
    title: "",
    category: "Cardio",
    description: "",
    exerciseMinutes: 30,
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

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

    addExercise({
      title: formData.title,
      category: formData.category,
      description: formData.description,
      exerciseMinutes: Number(
        formData.exerciseMinutes
      ),
    });

    onClose();
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
              NEW EXERCISE
            </p>

            <h2 id="add-exercise-title">
              Add Exercise
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
              className="primary-button"
            >
              Add Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExercise;