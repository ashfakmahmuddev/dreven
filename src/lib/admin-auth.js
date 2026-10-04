import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'dreven-admin-session';
const sessionDurationSeconds = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
  }
  return secret;
}

function sign(payload) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function isValidAdminPassword(password) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    throw new Error('ADMIN_PASSWORD is not configured.');
  }

  const provided = Buffer.from(password);
  const expected = Buffer.from(expectedPassword);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function createAdminSession() {
  const payload = String(Math.floor(Date.now() / 1000) + sessionDurationSeconds);
  return {
    value: `${payload}.${sign(payload)}`,
    maxAge: sessionDurationSeconds,
  };
}

export function verifyAdminSession(value) {
  if (!value) return false;
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra || !/^\d+$/.test(payload)) return false;
  if (Number(payload) <= Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
