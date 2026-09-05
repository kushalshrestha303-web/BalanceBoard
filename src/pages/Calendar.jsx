import { useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import { useDashboard } from "../context/DashboardContext";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateKey(year, month, day) {
  const monthValue = String(month + 1).padStart(2, "0");
  const dayValue = String(day).padStart(2, "0");
  return `${year}-${monthValue}-${dayValue}`;
}

function formatDisplayTime(time) {
  if (!time) return "";

  const [hourValue, minute] = time.split(":");
  const hour = Number(hourValue);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function Calendar() {
  const {
    tasks = [],
    exercises = [],
    scheduledSessions = [],
    addScheduledSession,
    updateScheduledSession,
    deleteScheduledSession,
  } = useDashboard();

  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(
    formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const [formData, setFormData] = useState({
    type: "study",
    linkedItemId: "",
    title: "",
    date: selectedDate,
    startTime: "09:00",
    duration: 25,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

    return cells;
  }, [year, month]);

  const selectedDateSessions = scheduledSessions
    .filter((session) => session.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const availableItems = formData.type === "study" ? tasks : exercises;

  function goPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(
      formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
    );
  }

  function openAddModal(dateKey = selectedDate) {
    setEditingSession(null);
    setSelectedDate(dateKey);
    setFormData({
      type: "study",
      linkedItemId: "",
      title: "",
      date: dateKey,
      startTime: "09:00",
      duration: 25,
    });
    setShowModal(true);
  }

  function openEditModal(session) {
    setEditingSession(session);
    setFormData({
      type: session.type,
      linkedItemId: session.linkedItemId ? String(session.linkedItemId) : "",
      title: session.title,
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
    });
    setShowModal(true);
  }

  function selectType(type) {
    setFormData((current) => ({
      ...current,
      type,
      linkedItemId: "",
      title: "",
      duration: type === "study" ? 25 : 30,
    }));
  }

  function handleLinkedItemChange(event) {
    const linkedItemId = event.target.value;
    const source = formData.type === "study" ? tasks : exercises;
    const selectedItem = source.find(
      (item) => String(item.id) === linkedItemId
    );

    setFormData((current) => ({
      ...current,
      linkedItemId,
      title: selectedItem?.title || current.title,
      duration:
        formData.type === "study"
          ? Number(selectedItem?.focusMinutes) || current.duration
          : Number(selectedItem?.exerciseMinutes) || current.duration,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanTitle = formData.title.trim();
    if (!cleanTitle || !formData.date) return;

    const payload = {
      ...formData,
      title: cleanTitle,
      duration: Number(formData.duration),
      linkedItemId: formData.linkedItemId
        ? Number(formData.linkedItemId)
        : null,
    };

    if (editingSession) {
      updateScheduledSession(editingSession.id, payload);
    } else {
      addScheduledSession(payload);
    }

    setSelectedDate(formData.date);
    setShowModal(false);
    setEditingSession(null);
  }

  return (
    <Layout>
      <section className="calendar-page">
        <div className="dashboard-header calendar-page-header">
          <div>
            <p className="page-eyebrow">PLAN YOUR BALANCE</p>
            <h1>Calendar</h1>
            <p className="dashboard-description">
              Schedule study and exercise sessions and keep your day organised.
            </p>
          </div>

          <button
            type="button"
            className="primary-button calendar-add-session"
            onClick={() => openAddModal()}
          >
            + Schedule Session
          </button>
        </div>

        <div className="calendar-layout">
          <article className="dashboard-card calendar-main-card">
            <div className="calendar-toolbar">
              <div>
                <p className="page-eyebrow">MONTH VIEW</p>
                <h2>{monthName}</h2>
              </div>

              <div className="calendar-toolbar-actions">
                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={goPreviousMonth}
                  aria-label="Previous month"
                >
                  ←
                </button>

                <button
                  type="button"
                  className="calendar-today-button"
                  onClick={goToday}
                >
                  Today
                </button>

                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={goNextMonth}
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>

            <div className="calendar-weekdays">
              {WEEK_DAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="calendar-grid-modern">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="calendar-cell calendar-cell-empty"
                    />
                  );
                }

                const dateKey = formatDateKey(year, month, day);
                const daySessions = scheduledSessions
                  .filter((session) => session.date === dateKey)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                const isToday =
                  dateKey ===
                  formatDateKey(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  );

                const selected = dateKey === selectedDate;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    className={`calendar-cell${isToday ? " is-today" : ""}${
                      selected ? " is-selected" : ""
                    }`}
                    onClick={() => setSelectedDate(dateKey)}
                    onDoubleClick={() => openAddModal(dateKey)}
                  >
                    <span className="calendar-day-number">{day}</span>

                    <div className="calendar-cell-events">
                      {daySessions.slice(0, 3).map((session) => (
                        <span
                          key={session.id}
                          className={`calendar-event-pill ${session.type}`}
                        >
                          <strong>
                            {session.type === "study" ? "📚" : "💪"}
                          </strong>
                          {formatDisplayTime(session.startTime)}
                          <span>{session.title}</span>
                        </span>
                      ))}

                      {daySessions.length > 3 && (
                        <span className="calendar-more-events">
                          +{daySessions.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </article>

          <aside className="dashboard-card calendar-agenda-card">
            <div className="calendar-agenda-header">
              <div>
                <p className="page-eyebrow">SELECTED DAY</p>
                <h2>
                  {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                    "en-AU",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }
                  )}
                </h2>
              </div>

              <button
                type="button"
                className="text-button"
                onClick={() => openAddModal(selectedDate)}
              >
                + Add
              </button>
            </div>

            <div className="calendar-agenda-list">
              {selectedDateSessions.length === 0 ? (
                <div className="calendar-agenda-empty">
                  <span>🗓️</span>
                  <h3>No sessions scheduled</h3>
                  <p>Add a study or exercise session for this day.</p>
                </div>
              ) : (
                selectedDateSessions.map((session) => (
                  <article
                    key={session.id}
                    className={`calendar-agenda-session ${session.type}`}
                  >
                    <div className="calendar-agenda-icon">
                      {session.type === "study" ? "📚" : "💪"}
                    </div>

                    <div className="calendar-agenda-content">
                      <span className="calendar-agenda-type">
                        {session.type === "study"
                          ? "Study session"
                          : "Exercise session"}
                      </span>

                      <h3>{session.title}</h3>
                      <p>
                        {formatDisplayTime(session.startTime)} · {session.duration}{" "}
                        min
                      </p>
                    </div>

                    <div className="calendar-agenda-actions">
                      <button
                        type="button"
                        onClick={() => openEditModal(session)}
                        aria-label={`Edit ${session.title}`}
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteScheduledSession(session.id)}
                        aria-label={`Delete ${session.title}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>

        {showModal && (
          <div
            className="modal-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowModal(false);
            }}
          >
            <form
              className="task-modal calendar-session-modal"
              onSubmit={handleSubmit}
            >
              <div className="modal-header">
                <div>
                  <p className="page-eyebrow">
                    {editingSession ? "EDIT SESSION" : "NEW SESSION"}
                  </p>
                  <h2>
                    {editingSession ? "Update session" : "Schedule a session"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="calendar-type-switch">
                <button
                  type="button"
                  className={formData.type === "study" ? "active" : ""}
                  onClick={() => selectType("study")}
                >
                  📚 Study
                </button>

                <button
                  type="button"
                  className={formData.type === "exercise" ? "active" : ""}
                  onClick={() => selectType("exercise")}
                >
                  💪 Exercise
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="calendar-linked-item">
                  Link to existing {formData.type === "study" ? "task" : "exercise"}
                </label>

                <select
                  id="calendar-linked-item"
                  value={formData.linkedItemId}
                  onChange={handleLinkedItemChange}
                >
                  <option value="">No linked item</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="calendar-title">Session title</label>
                <input
                  id="calendar-title"
                  type="text"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder={
                    formData.type === "study"
                      ? "e.g. Learn KQL"
                      : "e.g. Morning Walk"
                  }
                  required
                />
              </div>

              <div className="calendar-form-row">
                <div className="form-group">
                  <label htmlFor="calendar-date">Date</label>
                  <input
                    id="calendar-date"
                    type="date"
                    value={formData.date}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="calendar-time">Start time</label>
                  <input
                    id="calendar-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="calendar-duration">Duration</label>
                <select
                  id="calendar-duration"
                  value={formData.duration}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      duration: Number(event.target.value),
                    }))
                  }
                >
                  <option value={15}>15 minutes</option>
                  <option value={25}>25 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  {editingSession ? "Save Changes" : "Schedule Session"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </Layout>
  );
}

export default Calendar;
