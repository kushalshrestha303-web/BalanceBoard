// Password hashing with scrypt (memory-hard KDF) and a per-user random salt.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const KEY_LENGTH = 64;
const DUMMY_SALT = '0'.repeat(32);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await derive(password, salt, KEY_LENGTH)).toString('hex');
  return { salt, hash };
}

// Always runs scrypt (even for unknown users) so response time does not reveal which usernames exist.
export async function verifyPassword(password, salt, expectedHex) {
  const candidate = await derive(password, salt || DUMMY_SALT, KEY_LENGTH);
  if (!expectedHex) return false;
  return timingSafeEqual(candidate, Buffer.from(expectedHex, 'hex'));
}

export function validNewPassword(password) {
  return typeof password === 'string' && password.length >= 12 && password.length <= 128;
}
