import { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";

// Used for both creating a task and editing an existing one (when `task` is passed).
function AddTask({ onClose, task = null }) {
  const { addTask, updateTask } = useDashboard();
  const editing = Boolean(task);

  const [formData, setFormData] = useState({
    title: task?.title ?? "",
    category: task?.category ?? "Study",
    description: task?.description ?? "",
    focusMinutes: task?.focusMinutes ?? 25,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

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

    setSaving(true);
    try {
    const data = { ...formData, title, focusMinutes };
    if (editing) await updateTask(task.id, data);
    else await addTask(data);

    setError("");

    onClose();
    } catch(e) { setError(e.message); } finally { setSaving(false); }
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
              {editing ? "EDIT TASK" : "NEW TASK"}
            </p>

            <h2 id="add-task-title">
              {editing ? "Edit task" : "Create a task"}
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

              {editing && !["Study", "Learning", "Assignment", "Project", "Personal"].includes(task.category) && (
                <option value={task.category}>{task.category}</option>
              )}

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
            disabled={saving}
              className="primary-button"
            >
              {editing ? "Save Changes" : "Create Task"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddTask;