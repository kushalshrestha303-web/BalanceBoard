// Entry point: `npm start` runs this file. Tests import { app } without starting a listener.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { config } from './config.js';

export const app = createApp();

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  app.listen(config.port, () => console.log(`BalanceBoard API listening on http://localhost:${config.port}`));
}
