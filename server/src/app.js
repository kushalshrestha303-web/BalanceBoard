// Builds the Express application: middleware, API routes, the built React app and error handling.
import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';
import { securityHeaders, sameOriginOnly } from './middleware/security.js';
import { requireAuth } from './middleware/auth.js';
import { createAuthLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.js';
import { profileRoutes } from './routes/profile.js';
import { activityRoutes } from './routes/activities.js';
import { sessionRoutes } from './routes/sessions.js';
import { wellnessRoutes } from './routes/wellness.js';
import { sensorRoutes } from './routes/sensors.js';
import { timerRoutes } from './routes/timer.js';
import { dashboardRoutes } from './routes/dashboard.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(express.json({ limit: '32kb' }));
  app.use(securityHeaders);
  app.use(sameOriginOnly);

  const authLimiter = createAuthLimiter();

  // Public endpoints
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes(authLimiter));

  // Everything below requires a signed-in user
  const api = express.Router();
  api.use(requireAuth);
  api.use('/profile', profileRoutes(authLimiter));
  api.use('/tasks', activityRoutes('task'));
  api.use('/exercises', activityRoutes('exercise'));
  api.use('/sessions', sessionRoutes());
  api.use('/wellness', wellnessRoutes());
  api.use('/sensor-readings', sensorRoutes());
  api.use('/timer', timerRoutes());
  api.use(dashboardRoutes());
  app.use('/api', api);
  app.use('/api', notFound);

  // In production the API also serves the built React app; unknown paths fall back to index.html
  // so client-side routes (e.g. /calendar) work on refresh.
  const index = resolve(config.distDir, 'index.html');
  if (existsSync(index)) {
    app.use(express.static(config.distDir, { index: false }));
    app.use((req, res, next) => (req.method === 'GET' && req.accepts('html') ? res.sendFile(index) : next()));
  }

  app.use(errorHandler);
  return app;
}
