import { getDatabase } from '../../../../lib/mongodb';
import { hashCustomerPassword, setCustomerSession } from '../../../../lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit valid account details.' }, { status: 400 });
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

  if (!name || name.length > 100) {
    return Response.json({ error: 'Enter your name (up to 100 characters).' }, { status: 400 });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8 || Buffer.byteLength(password) > 1024) {
    return Response.json({ error: 'Your password must be at least 8 characters long.' }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return Response.json({ error: 'The passwords do not match.' }, { status: 400 });
  }

  try {
    const database = await getDatabase();
    const users = database.collection('customers');
    await users.createIndex({ email: 1 }, { unique: true });

    const now = new Date();
    const user = {
      name,
      email,
      passwordHash: await hashCustomerPassword(password),
      createdAt: now,
      updatedAt: now,
    };
    const result = await users.insertOne(user);
    await setCustomerSession(result.insertedId);

    return Response.json(
      { user: { name: user.name, email: user.email } },
      { status: 201 },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return Response.json(
        { error: 'An account with this email already exists. Please log in instead.' },
        { status: 409 },
      );
    }

    console.error('Customer account creation failed.', error);
    return Response.json(
      { error: 'We could not create your account right now. Please check the database connection and try again.' },
      { status: 503 },
    );
  }
}
