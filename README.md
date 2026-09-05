# ◉ BalanceBoard

### Study. Move. Reflect. Balance.

BalanceBoard is a responsive **student productivity and wellbeing web application** built with React.

It brings study planning, focus sessions, physical activity, mood, hydration, scheduling, analytics, and achievements together in one calm and easy-to-use interface.

> **One dashboard for a more balanced student life.**

---

## ◈ About BalanceBoard

University students often need to manage more than assignments and deadlines.

Study, exercise, hydration, mental wellbeing, scheduling, and productivity all contribute to a student's daily routine, but these activities are often managed using separate applications.

**BalanceBoard** was designed to bring these areas together.

The application helps students:

- Organise study tasks
- Complete focused study sessions
- Track exercise activities
- Schedule study and exercise sessions
- Record their daily mood
- Monitor hydration
- Analyse their progress
- Maintain a healthy Balance Score
- Unlock achievements
- Build positive habits through XP and levels

The goal is not simply to increase productivity.

The goal is to help students maintain a better **balance between academic progress and personal wellbeing**.

---

## ✦ Core Features

### ◉ Personal Dashboard

The Dashboard is the central workspace of BalanceBoard.

It provides a quick overview of the user's:

- Study tasks
- Exercise activities
- Focus time
- Exercise time
- Current streak
- Balance Score
- Scheduled sessions
- Mood
- Hydration progress

Changes made throughout the application are reflected dynamically in the Dashboard.

---

### ◻ Study Task Management

Students can create and manage their study activities from one location.

Each task can contain information such as:

- Task title
- Description
- Category
- Required focus time
- Completed focus time
- Completion status

Users can:

- Add tasks
- Complete tasks
- Delete tasks
- Monitor task progress
- Start focus sessions

This provides a simple workflow from planning to completion.

---

### ◷ Focus Timer

BalanceBoard includes an integrated Focus Timer.

Students can start focused sessions directly from study tasks or scheduled activities.

When a session is completed, the associated activity progress is updated.

```text
Task
  ↓
Start Focus
  ↓
Focus Timer
  ↓
Complete Session
  ↓
Progress Updated
```

This information can then contribute to Dashboard statistics, Analytics, Balance Score, and Achievements.

---

### ◇ Exercise Tracking

BalanceBoard encourages students to balance academic work with physical activity.

Users can:

- Create exercise activities
- Set exercise duration
- Start exercise focus sessions
- Monitor exercise progress
- Complete activities
- Delete activities

Study and exercise use a consistent card-based interface to keep the experience simple and familiar.

---

### ◫ Smart Scheduling Calendar

The interactive Calendar helps students plan their study and exercise sessions.

Users can:

- Navigate between months
- Select dates
- Schedule sessions
- Choose Study or Exercise
- Set a start time
- Set session duration
- Link sessions to activities
- Edit scheduled sessions
- Delete scheduled sessions
- View a daily agenda

Calendar sessions are connected with other parts of BalanceBoard.

```text
Calendar
   ↓
Scheduled Session
   ↓
Dashboard
   ↓
Focus Session
   ↓
Progress
```

This allows planning and activity tracking to work together rather than existing as separate features.

---

## ♡ Daily Wellness

BalanceBoard includes simple wellness tools alongside productivity features.

### Mood Tracker

Students can record how they are feeling using five mood options:

```text
😄 Great
🙂 Good
😐 Okay
😕 Low
😣 Stressed
```

The selected mood contributes to the user's daily Balance Score.

---

### Water Tracker

The Water Tracker provides a simple way to monitor daily hydration.

Users can:

- Add water
- Remove water
- View cups consumed
- View hydration progress
- View remaining cups
- Receive simple hydration feedback

BalanceBoard uses **8 cups as a simple in-app tracking goal**. Individual hydration requirements may vary.

---

## ◎ Balance Score

One of the main concepts behind BalanceBoard is the **Balance Score**.

Instead of measuring only academic productivity, the application considers four areas:

```text
             BALANCE SCORE
                  100
                   │
        ┌──────────┼──────────┐
        │          │          │
      Study     Exercise    Wellness
      25 pts     25 pts       │
                           ┌───┴───┐
                           │       │
                         Mood    Water
                        25 pts   25 pts
```

The maximum score is:

```text
Study       25
Exercise    25
Mood        25
Water       25
────────────────
Total      100
```

The purpose of this score is to encourage students to consider both **productivity and wellbeing**.

---

## ◔ Analytics

The Analytics page transforms application activity into understandable progress information.

It uses shared BalanceBoard data such as:

- Completed study tasks
- Completed exercises
- Study focus time
- Exercise time
- Balance Score
- Current streak
- Study progress
- Exercise progress

The Analytics interface is designed to help students quickly understand their activity rather than presenting unnecessary information.

---

## ★ Achievements

BalanceBoard includes a gamification system that rewards positive habits.

Achievements are divided into categories such as:

- Study
- Fitness
- Wellness
- Planning
- Balance
- Streak

Examples include:

| Achievement | Goal |
|---|---|
| First Step | Complete your first study task |
| Study Starter | Complete 5 study tasks |
| Focus Apprentice | Reach 60 minutes of focus |
| Deep Worker | Reach 300 minutes of focus |
| Focus Master | Reach 600 minutes of focus |
| Get Moving | Complete your first exercise |
| Active Five | Complete 5 exercises |
| Fitness Builder | Reach 120 exercise minutes |
| Hydration Starter | Start tracking water |
| Hydration Hero | Reach the hydration goal |
| Check In | Record your mood |
| Planner | Schedule a session |
| Plan & Execute | Complete scheduled sessions |
| Finding Balance | Reach a 50% Balance Score |
| Balanced Day | Reach an 80% Balance Score |
| Perfect Balance | Reach a 100% Balance Score |
| Getting Consistent | Build a 3-day streak |
| Week Warrior | Build a 7-day streak |

Locked achievements show progress towards their goal.

---

## ✦ XP & Level System

Achievements award XP.

As users unlock achievements, their total XP increases and allows them to progress through BalanceBoard levels.

```text
🌱 Getting Started
        ↓
📚 Habit Builder
        ↓
🎯 Focused Learner
        ↓
⚖️ Balanced Learner
        ↓
🔥 Momentum Maker
        ↓
💎 Balance Master
```

This provides additional motivation while keeping the focus on healthy and productive habits.

---

# ◈ Technology Stack

BalanceBoard was developed using modern frontend technologies.

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| JavaScript | Application logic |
| Vite | Development and build tooling |
| React Router | Client-side routing |
| Context API | Shared state management |
| React Hooks | Component state and lifecycle |
| HTML5 | Semantic page structure |
| CSS3 | Styling and responsive design |
| Local Storage | Client-side persistence |
| JSON | Mock application data |
| Git | Version control |
| GitHub | Team collaboration and repository hosting |
| Vercel | Production deployment |

---

# ◫ Application Architecture

BalanceBoard follows a component-based frontend architecture.

```text
                         BalanceBoard
                              │
                              ▼
                         React Router
                              │
                              ▼
                       Shared Layout
                              │
                              ▼
                     DashboardContext
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
          ▼                   ▼                  ▼
        Study              Exercise           Wellness
        Tasks              Activities       Mood + Water
          │                   │                  │
          └───────────────────┼──────────────────┘
                              │
                              ▼
                           Calendar
                              │
                              ▼
                          Dashboard
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                Analytics          Achievements
                                   XP + Levels
```

The architecture separates application pages, reusable components, state management, services, data, and styling.

---

## ◻ Project Structure

```text
src/
│
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── exercise/
│   ├── layout/
│   ├── tasks/
│   └── wellness/
│
├── context/
│   └── DashboardContext.jsx
│
├── data/
│   ├── achievements.json
│   └── tasks.json
│
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Analytics.jsx
│   ├── Calendar.jsx
│   ├── Achievements.jsx
│   └── NotFound.jsx
│
├── services/
│   └── dashboardService.js
│
├── styles/
│   ├── global.css
│   └── variables.css
│
├── App.jsx
└── main.jsx
```

---

## ◇ Reusable Component Design

BalanceBoard uses reusable components to reduce duplicated code and improve maintainability.

Examples include:

```text
Layout
Navigation
TaskCard
AddTask
ExerciseCard
AddExercise
FocusTimer
MoodTracker
WaterTracker
Button
Card
Loading
ErrorMessage
EmptyState
```

Pages combine these smaller components to create complete application views.

This approach makes the application easier to understand, maintain, test, and extend.

---

## ◎ State Management

Shared application state is managed using the **React Context API**.

`DashboardContext` provides common data and functions to components throughout BalanceBoard.

Shared state includes:

```text
Study Tasks
Exercise Activities
Wellness
Scheduled Sessions
Statistics
Streak
```

This allows multiple pages to use the same source of data.

For example:

```text
Mood Tracker
     │
     ▼
DashboardContext
     │
     ├──────► Dashboard
     │
     ├──────► Analytics
     │
     └──────► Achievements
```

This reduces duplicated state and creates a more connected application.

---

## ◉ Client-Side Routing

BalanceBoard uses **React Router** for multi-view navigation.

| Route | Page |
|---|---|
| `/` | Login |
| `/dashboard` | Dashboard |
| `/analytics` | Analytics |
| `/calendar` | Calendar |
| `/achievements` | Achievements |
| `*` | Not Found |

A shared `Layout` and `Navigation` component provides a consistent experience across the main pages.

---

## ◌ Data Handling

The application demonstrates frontend data handling through:

- JSON/mock data
- Asynchronous data loading
- React state
- Context state
- Loading states
- Error states
- Dynamic UI updates
- Local Storage

The frontend architecture can later be extended to communicate with a backend API and database.

---

## ✦ User Interaction

BalanceBoard contains a range of interactive functionality, including:

- Forms
- Form validation
- Add actions
- Delete actions
- Completion controls
- Focus timers
- Calendar scheduling
- Calendar editing
- Calendar filtering
- Mood selection
- Hydration controls
- Achievement filtering
- Progress indicators
- Modals
- Navigation

React state allows the interface to respond immediately to user actions.

---

# ♿ Accessibility

Accessibility was considered throughout the frontend design.

The application uses:

- Semantic HTML
- Clear heading hierarchy
- Form labels
- Native buttons and inputs
- Accessible navigation
- `aria-label` attributes where appropriate
- `aria-pressed` for selectable controls
- Progress accessibility attributes
- Keyboard-accessible controls
- Clear visual states
- Readable text contrast
- Consistent interaction patterns

---

# ◐ Responsive Design

BalanceBoard was designed for both desktop and smaller screens.

Responsive CSS adapts:

- Navigation
- Dashboard
- Statistics
- Task cards
- Exercise cards
- Calendar
- Analytics
- Achievement cards
- Mood Tracker
- Water Tracker

The responsive design allows students to access important functionality across different device sizes.

---

# ✦ UI / UX Design

BalanceBoard follows a **calm, clean and student-friendly visual design**.

The visual language uses:

- Purple and soft lilac as primary colours
- White and soft background surfaces
- Rounded cards
- Subtle borders and shadows
- Clear typography
- Consistent spacing
- Progress indicators
- Simple icons
- Clear selected and completed states

The interface was designed to present useful information without making the student experience feel unnecessarily complex or overwhelming.

---

# ⚙ Installation

## Requirements

Before running BalanceBoard, install:

- Node.js
- npm

---

## Clone the Repository

```bash
git clone https://github.com/kushalshrestha303-web/BalanceBoard.git
```

Enter the project:

```bash
cd BalanceBoard
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display a local URL, usually:

```text
http://localhost:5173/
```

---

# ⚙ Production Build

Create the production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# ◉ Live Application

**BalanceBoard Live Demo**

```text
ADD_VERCEL_URL_HERE
```

---

# ◇ GitHub Repository

```text
https://github.com/kushalshrestha303-web/BalanceBoard
```

---

# ◈ Team Collaboration

BalanceBoard was developed collaboratively for **ICT 930 – Advanced Web Application Development**.

Git and GitHub are used for:

- Version control
- Team collaboration
- Feature development
- Code integration
- Tracking changes
- Maintaining project history
- Recording individual contributions

Each team member contributes to the development process through meaningful Git commits.

---

# ◌ Future Improvements

BalanceBoard currently focuses on frontend functionality.

Future development could include:

- Backend API integration
- Database persistence
- Secure authentication
- User registration
- Cloud user profiles
- Google Calendar integration
- Notifications and reminders
- Long-term mood history
- Long-term hydration history
- Weekly and monthly historical analytics
- Expanded achievement system
- Personalised wellbeing recommendations

---

# ◉ Assessment Information

**Unit:** ICT 930 – Advanced Web Application Development  
**Course:** MIT  
**Semester:** Semester 2, 2026  
**Assessment:** Assignment 2 – Frontend Design Overview

BalanceBoard demonstrates the practical implementation of:

- React functional components
- React Hooks
- Component architecture
- Client-side routing
- Shared and local state
- Data handling
- Asynchronous loading
- Loading and error states
- User interaction
- Responsive design
- Accessibility
- Maintainable code structure
- Version control
- Professional frontend development practices

---

# ◈ Team Members

| Team Member | Role |
|---|---|
| ADD NAME | ADD ROLE |
| ADD NAME | ADD ROLE |
| ADD NAME | ADD ROLE |

---

## ✦ Academic Project

BalanceBoard was developed for educational purposes as part of **ICT 930 – Advanced Web Application Development**.

**BalanceBoard ◉ — Study. Move. Reflect. Balance.**