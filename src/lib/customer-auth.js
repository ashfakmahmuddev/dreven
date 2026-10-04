import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { ObjectId } from './mongodb';

const scrypt = promisify(scryptCallback);
export const CUSTOMER_SESSION_COOKIE = 'dreven-customer-session';
const sessionDurationSeconds = 60 * 60 * 24 * 30;
const passwordKeyLength = 64;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
  }
  return secret;
}

function sign(payload) {
  return createHmac('sha256', getSessionSecret())
    .update(`customer-session:${payload}`)
    .digest('base64url');
}

export async function hashCustomerPassword(password) {
  const salt = randomBytes(16).toString('base64url');
  const key = await scrypt(password, salt, passwordKeyLength);
  return `scrypt$${salt}$${key.toString('base64url')}`;
}

export async function verifyCustomerPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const [algorithm, salt, encodedKey, extra] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !encodedKey || extra) return false;

  const expected = Buffer.from(encodedKey, 'base64url');
  if (expected.length !== passwordKeyLength) return false;
  const actual = await scrypt(password, salt, passwordKeyLength);
  return timingSafeEqual(expected, actual);
}

export function createCustomerSession(userId) {
  const expiresAt = String(Math.floor(Date.now() / 1000) + sessionDurationSeconds);
  const payload = `${userId}.${expiresAt}`;
  return {
    value: `${payload}.${sign(payload)}`,
    maxAge: sessionDurationSeconds,
  };
}

export function verifyCustomerSession(value) {
  if (!value) return null;
  const [userId, expiresAt, signature, extra] = value.split('.');
  if (
    extra ||
    !ObjectId.isValid(userId) ||
    !/^\d+$/.test(expiresAt || '') ||
    Number(expiresAt) <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const payload = `${userId}.${expiresAt}`;
  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature || '');
  return expected.length === provided.length && timingSafeEqual(expected, provided)
    ? new ObjectId(userId)
    : null;
}

export async function setCustomerSession(userId) {
  const session = createCustomerSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.maxAge,
  });
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  return verifyCustomerSession(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
