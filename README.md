# BalanceBoard · Full-stack application

Study, exercise, calendar, mood, hydration, analytics and achievements for student wellbeing. Built from the original ICT930 React frontend with a persistent Express/SQLite backend.

For a public HTTPS deployment where anyone with a Google account can sign in, follow [DEPLOY.md](DEPLOY.md). The local SQLite database needs persistent hosting storage.

## Run locally

Requires **Node.js 22.13+** and npm. In this folder:

```bash
npm ci
npm ci --prefix server
npm run dev
```

Open **http://localhost:5173**. The command starts Vite and the API on port 3001. Create an account with a 12+ character password; your work is saved to `server/data/balanceboard.sqlite` and remains after a restart. Accounts have separate data. No database service, API key, or `.env` is required.

### Enable Google sign-in

Password sign-in works immediately. To enable the Google button:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure the OAuth consent screen and create an **OAuth client ID** of type **Web application**. Choose External for accounts outside your organization; see DEPLOY.md for public access settings.
2. Add **`http://localhost:5173/api/auth/google/callback`** as an authorized redirect URI. Use **`http://localhost:5173`** as an authorized JavaScript origin if requested.
3. Copy `.env.example` to `.env` in this project folder. Put your real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into `.env`; keep `APP_ORIGIN=http://localhost:5173` for development.
4. Restart `npm run dev`, open **http://localhost:5173/login**, and choose **Continue with Google**. The button is disabled until configuration is present. Never commit `.env` or share your client secret.

Google sign-in uses the authorization-code flow with state, nonce and PKCE; the backend verifies Google's signed identity token and creates a local session. Google accounts are separate from password accounts even if the email address happens to match. When using `npm start` on port 3001, use `APP_ORIGIN=http://localhost:3001` and register **`http://localhost:3001/api/auth/google/callback`** instead. For a public deployment, use your HTTPS site origin and corresponding HTTPS callback URI. Google sign-in requires the backend to reach Google's OAuth and certificate endpoints.

To build and run from one production server:

```bash
npm run build
npm start
```

Open **http://localhost:3001**. Change `PORT` if port 3001 is busy. Set `DB_PATH` to an absolute path to relocate the database. Use HTTPS when deploying publicly so session cookies use the Secure attribute. Back up the SQLite database file to retain accounts and activity. Do not upload the database or `node_modules` to Git.

## How it works

- Register or sign in with a password or a configured Google account. Passwords are hashed with scrypt and a unique salt. Sessions use a random token in an HttpOnly, SameSite=Strict cookie. The database stores only a hash of each session token. Logout invalidates it.
- The Pomodoro/exercise timer is shared across routes and stored per account in SQLite. Start it on Dashboard, then visit Calendar, Profile, Analytics or another page: a compact timer stays visible. Refreshing or reopening the app restores the same deadline. It continues while you are signed out or the browser is closed; use Pause to stop counting. At zero, choose Save progress to credit elapsed time once. Reset and Discard intentionally remove unsaved elapsed time. Only one timer is active per account; other tabs sync within 15 seconds or when focused. The timer is not a background alarm service.
- Add study tasks and exercise items; track time, complete or delete them. All mutations are checked and scoped to the signed-in account.
- Schedule or edit calendar sessions. A new standalone session creates a linked task or exercise. A linked session refers only to an item in your account. Deleted items are unlinked from calendar sessions.
- Mood and water are saved per local calendar day. The activity streak uses days on which activity was recorded. The existing analytics and achievements use the persisted dashboard data.
- Upcoming sessions show a configurable reminder banner (0, 5, 10, or 30 minutes before start). The app does not send email or background push notifications.
- Click your profile avatar/name to edit your display name and optional email, inspect account details, change a local password, and save per-account alarm settings. Profile email is not verified and is never used for delivery.
- At a scheduled session's start, the authenticated alarm endpoint returns only that user's due sessions. While BalanceBoard is open, the page shows an alarm, attempts a short ringtone and vibration when enabled and supported, and can show a desktop notification with browser permission. Click **Test ringtone & vibration** in Profile to allow browser audio. The browser may throttle an inactive tab; the app cannot guarantee an alarm after the tab/browser is closed or the device is asleep.

## API

`GET /api/health`, `/api/auth/providers`, `/api/auth/google`, `/api/auth/google/callback`; `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`; `GET /api/auth/me`, `/api/profile`, `/api/alarms/due?day=YYYY-MM-DD&time=HH:mm`, `/api/dashboard?day=YYYY-MM-DD`; `PATCH /api/profile`, `/api/profile/password`; `POST /api/actions`; `GET /api/timer`, `PUT /api/timer`, `POST /api/timer/actions`. Protected endpoints require the session cookie. `POST /api/actions` accepts `{ "type": "task.add", "payload": { "title": "Study", "focusMinutes": 25 } }` and typed task, exercise, wellness and session actions implemented in `server/src/server.js`.

## Verify

```bash
npm run build
npm test
```

The API test covers registration through the development origin, rejection of unrelated origins, profile persistence and validation, password change, due alarms and user isolation, logout, and a mocked Google OAuth exchange with a signed ID token. The timer integration test restarts the actual API process against the same database and checks deadline recovery, pause/resume, account isolation, stale-tab conflicts, completion and duplicate-save rejection. The build and both API suites pass. Browser navigation could not be tested in the remote browser because access to the local app was blocked. Live Google sign-in still requires your own OAuth client credentials. In the browser, create an account, add a task and calendar session for the next minute, open Profile to test sound/vibration and allow notifications, then keep the app open until the session starts. Refresh, sign out and sign back in to check persistence.

### Check the timer in your browser

1. Add a two-minute study task; select **Focus**, then **Start / Resume**.
2. Visit Calendar, Profile and Analytics. The compact timer should continue counting down.
3. Refresh the page. It should restore the original deadline, without restarting at two minutes.
4. Pause, navigate and refresh; the remaining time should stay unchanged. Resume it.
5. At zero, select **Save progress**. The task should show its completed minutes once and the timer should clear.
6. Sign into a different account; it should not see the first account's timer or activities.

The same checks apply to exercise timers. Deleting the activity also deletes its timer.

## Deployment status

This archive contains application code and setup instructions, not a live deployment or a guarantee of zero defects. Google credentials, public HTTPS hosting and a persistent disk must be configured by the owner. This SQLite version runs as a single server instance; it has not been load tested for a large public audience. Keep database backups and test restoration before relying on it for important data. Configure `NODE_ENV=production` and the exact `APP_ORIGIN` in hosting. If enabling `TRUST_PROXY=1`, ensure requests reach Node only through one trusted reverse proxy; this setting affects client-IP rate limiting.

## Project layout

- `src/` — existing React views and components, authenticated routing and API-backed context.
- `server/src/server.js` — Express routes, authentication, validation and SQLite schema.
- `server/src/googleAuth.js` — Google ID-token signature and claim validation.
- `src/pages/Profile.jsx` — account settings and alarm controls.
- `src/components/layout/Reminders.jsx` — upcoming sessions and in-page alarm handling.
- `server/src/server.test.js` and `server/src/timer.test.js` — API integration tests.
- `server/src/timer.js` — persistent timer state and atomic progress saves.
- `src/context/TimerContext.jsx` — shared timer state, deadline display and synchronization.
- `server/data/` — database location created on first run; its files are ignored by Git.
- `scripts/dev.js` — launches frontend and backend together.

BalanceBoard was originally created for ICT930 Assignment 2 Frontend Design Overview. This version extends the supplied frontend into a local full-stack application; it does not claim deployment or an unprovided assessment rubric.

## Assessment 3 fit and submission gaps

The supplied ICT930 Assessment 3 brief requests a React-style frontend with at least five views, responsive forms and routing, backend CRUD/API and validation, a persistent database, API-based state management, and authentication. This project demonstrates those features locally. It addresses student time and wellbeing, which is an **equivalent proposed domain** rather than one of the listed approved domains; seek tutor approval for that domain as the brief requires. SQLite is persistent and suitable for this local demonstration, but the report should justify its selection and describe how a deployed multi-user system would use a more scalable database.

The rubric unexpectedly assesses a *native app and sensor integration*, despite the detailed instructions calling for a web application. Browser vibration is an optional output capability, **not a sensor**. Confirm how the sensor criterion applies with the tutor; do not claim that the project meets it. The case study report (maximum five pages), architecture and data-flow diagrams, screenshots and testing evidence, repository/Git link, presentation slides, contribution statement and live team demonstration are separate submission requirements and are not contained in this source archive. No mark or HD outcome can be guaranteed from the code alone.

The attached brief also contains conflicting statements about permitted AI assistance, including a strict prohibition on AI-generated code/report/presentation; review those instructions and the declaration requirements before submitting any work based on this archive.
