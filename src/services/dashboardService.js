const initialDashboardData = {
  tasks: [
    {
      id: 1,
      title: "Learn KQL",
      category: "Study",
      description:
        "Practice KQL queries for Microsoft Sentinel.",
      focusMinutes: 25,
      completedFocusMinutes: 0,
      completed: false,
    },
  ],

  exercises: [
    {
      id: 101,
      title: "Morning Walk",
      category: "Walking",
      description:
        "A short walk to improve energy and wellbeing.",
      exerciseMinutes: 30,
      completedExerciseMinutes: 0,
      completed: false,
    },
  ],

  wellness: {
    mood: "",
    water: 0,
  },

  streak: 7,
};

export function getDashboardData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(initialDashboardData);
    }, 500);
  });
}