// Password hashing with Node's built-in scrypt — no native dep, no hand-rolled
// crypto primitives. Lucia manages sessions; we own the credential check and
// hand Lucia a validated userId. Format stored as `salt:derivedKey` (both hex).
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const key = Buffer.from(keyHex, 'hex');
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  // Constant-time compare; guard length first (timingSafeEqual throws on mismatch).
  return key.length === derived.length && timingSafeEqual(key, derived);
}
