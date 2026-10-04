// Central configuration: every environment variable the API reads is resolved here.
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(serverRoot, '..');
const envFile = resolve(projectRoot, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const appOrigin = process.env.APP_ORIGIN?.replace(/\/$/, '');
if (appOrigin) {
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(appOrigin);
  if (new URL(appOrigin).origin !== appOrigin || (!appOrigin.startsWith('https://') && !local)) {
    throw new Error('APP_ORIGIN must be an HTTPS origin or a localhost development origin.');
  }
}

const google = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

export const config = {
  appOrigin,
  isProduction: process.env.NODE_ENV === 'production',
  trustProxy: process.env.TRUST_PROXY === '1',
  dbPath: resolve(process.env.DB_PATH || resolve(serverRoot, 'data/balanceboard.sqlite')),
  distDir: resolve(projectRoot, 'dist'),
  port: Number(process.env.PORT || 3001),
  google: { ...google, enabled: Boolean(appOrigin && google.clientId && google.clientSecret) },
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
};
