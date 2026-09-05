import {
  useEffect,
  useState,
} from "react";

function FocusTimer({
  selectedSession,
  onComplete,
}) {

  // =========================
  // GET SESSION TYPE
  // =========================

  function getSessionType(session) {

    if (!session) {
      return "study";
    }

    return (
      session.sessionType ||
      "study"
    );
  }


  // =========================
  // GET SESSION MINUTES
  // =========================

  function getSessionMinutes(session) {

    if (!session) {
      return 25;
    }

    const sessionType =
      getSessionType(session);


    // EXERCISE
    if (
      sessionType === "exercise"
    ) {

      const minutes =
        Number(
          session.exerciseMinutes
        );

      return (
        Number.isFinite(minutes) &&
        minutes > 0
      )
        ? minutes
        : 30;
    }


    // STUDY
    const minutes =
      Number(
        session.focusMinutes
      );

    return (
      Number.isFinite(minutes) &&
      minutes > 0
    )
      ? minutes
      : 25;
  }


  // =========================
  // SESSION DETAILS
  // =========================

  const sessionType =
    getSessionType(
      selectedSession
    );


  const isExercise =
    sessionType === "exercise";


  const sessionMinutes =
    getSessionMinutes(
      selectedSession
    );


  // =========================
  // STATE
  // =========================

  const [timeLeft, setTimeLeft] =
    useState(25 * 60);

  const [isRunning, setIsRunning] =
    useState(false);


  // =========================
  // RESET WHEN SESSION CHANGES
  // =========================

  useEffect(() => {

    setIsRunning(false);

    const newSessionMinutes =
      getSessionMinutes(
        selectedSession
      );

    setTimeLeft(
      newSessionMinutes * 60
    );

  }, [selectedSession]);


  // =========================
  // COUNTDOWN
  // =========================

  useEffect(() => {

    if (!isRunning) {
      return;
    }


    if (timeLeft <= 0) {

      setIsRunning(false);

      return;
    }


    const timer =
      setInterval(() => {

        setTimeLeft(
          (currentTime) =>
            Math.max(
              0,
              currentTime - 1
            )
        );

      }, 1000);


    return () => {

      clearInterval(timer);

    };

  }, [
    isRunning,
    timeLeft,
  ]);


  // =========================
  // TIME CALCULATION
  // =========================

  const safeTimeLeft =
    Number(timeLeft) || 0;


  const minutes =
    Math.floor(
      safeTimeLeft / 60
    );


  const seconds =
    safeTimeLeft % 60;


  // =========================
  // START / PAUSE
  // =========================

  function handleStartPause() {

    if (!selectedSession) {

      alert(
        "Please select a study task or exercise first."
      );

      return;
    }


    setIsRunning(
      (currentValue) =>
        !currentValue
    );

  }


  // =========================
  // RESET
  // =========================

  function handleReset() {

    setIsRunning(false);

    setTimeLeft(
      sessionMinutes * 60
    );

  }


  // =========================
  // SAVE PROGRESS
  // =========================

  function handleComplete() {

    if (!selectedSession) {

      alert(
        "Please select an activity first."
      );

      return;
    }


    const remainingMinutes =
      safeTimeLeft / 60;


    const completedMinutes =
      Math.max(
        1,
        Math.round(
          sessionMinutes -
          remainingMinutes
        )
      );


    onComplete(
      selectedSession,
      completedMinutes
    );


    setIsRunning(false);

  }


  // =========================
  // PROGRESS
  // =========================

  const progressPercentage =
    selectedSession
      ? Math.max(
          0,
          Math.min(
            100,
            (
              1 -
              safeTimeLeft /
              (sessionMinutes * 60)
            ) * 100
          )
        )
      : 0;


  // =========================
  // DISPLAY TEXT
  // =========================

  const heading =
    isExercise
      ? "Exercise Session"
      : "Deep Work";


  const icon =
    isExercise
      ? "💪"
      : "🍅";


  const sessionLabel =
    isExercise
      ? "EXERCISE SESSION"
      : "FOCUS SESSION";


  const startButton =
    isExercise
      ? "▶ Start Exercise"
      : "▶ Start Focus";


  const saveButton =
    isExercise
      ? "💪 Save Exercise Progress"
      : "🍅 Save Focus Progress";


  // =========================
  // UI
  // =========================

  return (

    <article className="dashboard-card focus-card">


      {/* HEADER */}

      <div className="card-heading">

        <div>

          <p className="page-eyebrow">

            {sessionLabel}

          </p>


          <h2>

            {heading}

          </h2>

        </div>


        <span className="card-icon">

          {icon}

        </span>

      </div>



      {/* CURRENT ACTIVITY */}

      <div className="focus-task-area">

        {selectedSession ? (

          <>

            <p className="focus-label">

              CURRENT ACTIVITY

            </p>


            <h3>

              {selectedSession.title}

            </h3>


            {selectedSession.category && (

              <span className="focus-category">

                {selectedSession.category}

              </span>

            )}

          </>

        ) : (

          <>

            <p className="focus-label">

              READY TO START

            </p>


            <h3>

              Select an activity below

            </h3>


            <p>

              Choose Focus for study or
              Exercise Focus for exercise.

            </p>

          </>

        )}

      </div>



      {/* TIMER */}

      <div className="modern-timer">

        <div

          className="timer-ring"

          style={{

            background: `conic-gradient(
              var(--primary-purple)
              ${progressPercentage * 3.6}deg,
              var(--light-lilac)
              0deg
            )`,

          }}

        >

          <div className="timer-inner">


            <p className="timer-status">

              {isRunning
                ? isExercise
                  ? "EXERCISING"
                  : "FOCUSING"
                : "READY"}

            </p>


            <h2>

              {String(minutes).padStart(
                2,
                "0"
              )}

              :

              {String(seconds).padStart(
                2,
                "0"
              )}

            </h2>


            <p>

              {selectedSession

                ? `${sessionMinutes} minute session`

                : "Select an activity"}

            </p>

          </div>

        </div>

      </div>



      {/* CONTROLS */}

      <div className="focus-controls">


        <button

          type="button"

          className="primary-button"

          onClick={
            handleStartPause
          }

        >

          {isRunning

            ? "❚❚ Pause"

            : startButton}

        </button>



        <button

          type="button"

          className="secondary-button"

          onClick={
            handleReset
          }

        >

          ↻ Reset

        </button>

      </div>



      {/* SAVE */}

      {selectedSession && (

        <button

          type="button"

          className="complete-focus-button"

          onClick={
            handleComplete
          }

        >

          {saveButton}

        </button>

      )}


    </article>

  );

}


export default FocusTimer;