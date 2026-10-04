import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return Response.json({ authenticated: false });
}
