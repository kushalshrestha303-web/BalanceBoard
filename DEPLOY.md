# Publish BalanceBoard with Google sign-in

These steps use a Render **paid web service with a persistent disk**. Check the price shown in your Render account before selecting a plan. A free Render web service loses local SQLite data on restarts and redeploys, so it is unsuitable for real user accounts with this version of BalanceBoard.

## 1. Publish the project to GitHub

Extract `BalanceBoard-fullstack.zip`. Open PowerShell in the extracted `balanceboard` folder. Confirm it contains `package.json`, `server/`, and `.gitignore`.

Create an empty GitHub repository (for example, `balanceboard`) without an auto-generated README, then run these commands, replacing the remote URL with your repository:

```powershell
git init
git add .
git status --short
git commit -m "Prepare BalanceBoard deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/balanceboard.git
git push -u origin main
```

Before committing, ensure `git status --short` does **not** list `.env`, `node_modules`, `dist`, or `server/data`. The OAuth client secret belongs only in the host's private environment settings.

## 2. Create a persistent Render web service

In [Render Dashboard](https://dashboard.render.com), choose **New > Web Service**, connect the GitHub repository, and select **Node**. Set the root directory to the repository root (leave the optional Root Directory field blank if your repository contains `package.json` at top level):

| Field | Value |
| --- | --- |
| Build command | `npm ci --include=dev && npm ci --prefix server && npm run build` |
| Start command | `npm start` |
| Health check path (if shown) | `/api/health` |
| Instance | A paid plan that supports persistent disks |

Add a persistent disk with mount path `/var/data`; choose the smallest suitable disk size. Under **Environment**, set `DB_PATH=/var/data/balanceboard.sqlite` and `NODE_ENV=production`. Leave `PORT` unset; the application reads the port assigned by Render. Set `NODE_VERSION=24` to use the Node 24 release line, which supports the built-in SQLite API used here.

Deploy. Copy the HTTPS `.onrender.com` address given to your service (for example, `https://balanceboard-xyz.onrender.com`). Test `<your-address>/api/health`; it should return `{"status":"ok"}`.

## 3. Set up public Google OAuth

In [Google Auth Platform](https://console.cloud.google.com/auth/overview), select a project. Fill in **Branding**, choose **External** in **Audience**, and use **In production** publishing status for a public app. Create an OAuth client of type **Web application** under **Clients**.

Replace the example domain below with your actual Render address:

| Google field | Example |
| --- | --- |
| Authorized JavaScript origin | `https://balanceboard-xyz.onrender.com` |
| Authorized redirect URI | `https://balanceboard-xyz.onrender.com/api/auth/google/callback` |

Copy the Google client ID and client secret at creation. The redirect URI must match exactly, including scheme, hostname and path. This app requests only `openid email` and does not restrict Google accounts in its own database. External permits personal accounts and accounts outside your organization. Complete any branding/verification requirements Google displays. Workspace administrators may still restrict sign-in for their users.

## 4. Add secrets to Render and test

On your Render service's **Environment** page, add these server-side variables and save/redeploy:

```text
APP_ORIGIN=https://balanceboard-xyz.onrender.com
GOOGLE_CLIENT_ID=<the client ID from Google>
GOOGLE_CLIENT_SECRET=<the client secret from Google>
DB_PATH=/var/data/balanceboard.sqlite
NODE_ENV=production
NODE_VERSION=24
```

Open `<your-address>/login`, choose **Continue with Google**, and sign in. Test with a second Google account in another browser/private window. Each account should start with its own empty dashboard; a page refresh and redeploy should retain its data.

If you see `redirect_uri_mismatch`, compare the registered Google redirect URI with `APP_ORIGIN` plus `/api/auth/google/callback`. If the Google button is disabled, check that all three Google-related environment variables are set and redeploy. If accounts disappear after a redeploy, check that the persistent disk is mounted at `/var/data` and `DB_PATH` points inside it.

The page alarm works only while BalanceBoard is open. Hosting the web service does not create push notifications or phone alarms when the browser is closed.

## 5. Verify the timer after deployment

Add a two-minute task, choose Focus and Start / Resume, then navigate to Calendar and Profile. The compact timer should keep counting down. Refresh: it should restore the same deadline. Pause and refresh: it should remain paused. Resume, let it finish, then Save progress. Verify the task receives the minutes once. A running timer continues while the browser is closed and displays the elapsed result on reopening; progress is credited only when Save progress is selected.

This package has passed a production build and automated API tests, including a real API restart during a running timer. It has not been live-deployed or tested with your Google client credentials. Use one server instance with this SQLite disk setup. Back up and test restoring your database. Configure proxy trust only for your actual trusted reverse-proxy topology; the optional `TRUST_PROXY=1` setting expects one trusted proxy and controls client-IP rate limiting.

### Official references

- [Google app audience settings](https://support.google.com/cloud/answer/15549945?hl=en)
- [Google OAuth client configuration](https://support.google.com/cloud/answer/15549257?hl=en)
- [Render Node web services](https://render.com/docs/web-services)
- [Render persistent disks](https://render.com/docs/disks)
