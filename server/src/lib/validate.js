// Input validators. Each returns a clean value or throws a 400 HttpError.
import { fail } from './errors.js';

export const MOODS = ['great', 'good', 'okay', 'low', 'stressed'];
export const MAX_WATER_CUPS = 8;

export function requiredText(value, label, max = 160) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `${label} must be 1–${max} characters.`);
  return value.trim();
}

export function optionalText(value, label = 'Text', max = 1000) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max) fail(400, `${label} must be at most ${max} characters.`);
  return value.trim();
}

export function minutes(value, label = 'Minutes') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 1440) fail(400, `${label} must be a whole number between 1 and 1440.`);
  return n;
}

export function id(value, label = 'ID') {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(400, `Invalid ${label}.`);
  return n;
}

export function isoDate(value) {
  const valid = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  if (!valid) fail(400, 'Invalid date.');
  return value;
}

export function clockTime(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) fail(400, 'Invalid time.');
  return value;
}

export function boolean(value, label) {
  if (typeof value !== 'boolean') fail(400, `${label} must be true or false.`);
  return value;
}

export function mood(value) {
  if (value === '' || MOODS.includes(value)) return value;
  return fail(400, `Mood must be one of: ${MOODS.join(', ')}.`);
}

export function plainObject(value, label = 'Request body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, `${label} must be a JSON object.`);
  return value;
}

export const today = () => new Date().toISOString().slice(0, 10);
