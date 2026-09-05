import { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";

function AddTask({ onClose }) {
  const { addTask } = useDashboard();

  const [formData, setFormData] = useState({
    title: "",
    category: "Study",
    description: "",
    focusMinutes: 25,
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const title =
      formData.title.trim();

    const focusMinutes =
      Number(formData.focusMinutes);

    if (!title) {
      setError(
        "Please enter a task title."
      );
      return;
    }

    if (
      !Number.isFinite(focusMinutes) ||
      focusMinutes <= 0
    ) {
      setError(
        "Focus time must be greater than zero."
      );
      return;
    }

    addTask({
      ...formData,
      title,
      focusMinutes,
    });

    setError("");

    onClose();
  }

  return (
    <div className="modal-overlay">

      <div
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
      >

        <div className="modal-header">

          <div>

            <p className="page-eyebrow">
              NEW TASK
            </p>

            <h2 id="add-task-title">
              Create a task
            </h2>

          </div>


          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close task form"
          >
            ✕
          </button>

        </div>


        <form onSubmit={handleSubmit}>


          {/* TASK TITLE */}

          <div className="form-group">

            <label htmlFor="title">
              Task title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="Example: Finish React assignment"
              value={formData.title}
              onChange={handleChange}
            />

          </div>


          {/* CATEGORY */}

          <div className="form-group">

            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >

              <option value="Study">
                📚 Study
              </option>

              <option value="Learning">
                📖 Learning
              </option>

              <option value="Assignment">
                📝 Assignment
              </option>

              <option value="Project">
                💻 Project
              </option>

              <option value="Personal">
                🌱 Personal
              </option>

            </select>

          </div>


          {/* DESCRIPTION */}

          <div className="form-group">

            <label htmlFor="description">
              Learning note
            </label>

            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="What are you planning to learn or complete?"
              value={formData.description}
              onChange={handleChange}
            />

          </div>


          {/* FOCUS MINUTES */}

          <div className="form-group">

            <label htmlFor="focusMinutes">
              Focus time (minutes)
            </label>

            <input
              id="focusMinutes"
              name="focusMinutes"
              type="number"
              min="1"
              value={formData.focusMinutes}
              onChange={handleChange}
            />

          </div>


          {/* ERROR */}

          {error && (

            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>

          )}


          {/* BUTTONS */}

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
              Create Task
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddTask;