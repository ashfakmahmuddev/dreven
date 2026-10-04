import { getDatabase } from '../../../../lib/mongodb';
import {
  setCustomerSession,
  verifyCustomerPassword,
} from '../../../../lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || email.length > 254 || !password || Buffer.byteLength(password) > 1024) {
    return Response.json({ error: 'Enter a valid email and password.' }, { status: 400 });
  }

  try {
    const database = await getDatabase();
    const user = await database.collection('customers').findOne({ email });
    if (!user || !(await verifyCustomerPassword(password, user.passwordHash || ''))) {
      return Response.json({ error: 'The email or password is incorrect.' }, { status: 401 });
    }

    await setCustomerSession(user._id);
    return Response.json({ user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Customer sign-in failed.', error);
    return Response.json(
      { error: 'We could not log you in right now. Please check the database connection and try again.' },
      { status: 503 },
    );
  }
}
