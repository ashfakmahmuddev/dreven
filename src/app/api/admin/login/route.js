import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  isValidAdminEmail,
  isValidAdminPassword,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const attempts = new Map();
const attemptWindowMs = 15 * 60 * 1000;
const maximumAttempts = 5;

function getAttemptRecord(key) {
  const now = Date.now();
  const previous = attempts.get(key);
  if (!previous || now - previous.startedAt >= attemptWindowMs) {
    return { startedAt: now, count: 0 };
  }
  return previous;
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export async function POST(request) {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const record = getAttemptRecord(address);

  if (record.count >= maximumAttempts) {
    return Response.json(
      { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'A valid JSON sign-in request is required.' }, { status: 400 });
  }

  try {
    const email = normalizeEmail(body?.email);
    const password = typeof body?.password === 'string' ? body.password : '';
    const validEmail = isValidAdminEmail(email);
    const validPassword = password && isValidAdminPassword(password);

    if (!email || !password || !validEmail || !validPassword) {
      record.count += 1;
      attempts.set(address, record);
      return Response.json({ error: 'Incorrect admin email or password.' }, { status: 401 });
    }

    attempts.delete(address);
    const session = createAdminSession();
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, session.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: session.maxAge,
    });

    return Response.json({ authenticated: true });
  } catch (error) {
    console.error('Admin sign-in failed.', error);
    return Response.json(
      { error: 'Admin sign-in is not configured correctly.' },
      { status: 503 },
    );
  }
}
