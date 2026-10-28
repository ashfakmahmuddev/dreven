import { getDatabase } from '../../../../lib/mongodb';
import {
  getCustomerSession,
  hashCustomerPassword,
} from '../../../../lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit valid profile details.' }, { status: 400 });
  }

  const userId = await getCustomerSession();
  if (!userId) {
    return Response.json({ error: 'Please log in to update your account.' }, { status: 401 });
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!name || name.length > 100) {
    return Response.json({ error: 'Enter your name (up to 100 characters).' }, { status: 400 });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (phone && (phone.length < 7 || phone.length > 30)) {
    return Response.json({ error: 'Enter a valid phone number.' }, { status: 400 });
  }
  if (password && (password.length < 8 || Buffer.byteLength(password) > 1024)) {
    return Response.json({ error: 'Your password must be at least 8 characters long.' }, { status: 400 });
  }

  try {
    const database = await getDatabase();
    const customers = database.collection('customers');
    const currentUser = await customers.findOne({ _id: userId });
    if (!currentUser) {
      return Response.json({ error: 'Your account could not be found.' }, { status: 404 });
    }

    const existingUser = await customers.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return Response.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const update = {
      name,
      email,
      phone: phone || '',
      updatedAt: new Date(),
    };

    if (password) {
      update.passwordHash = await hashCustomerPassword(password);
    }

    await customers.updateOne({ _id: userId }, { $set: update });

    return Response.json({
      user: {
        name,
        email,
        phone: phone || '',
      },
    });
  } catch (error) {
    console.error('Customer profile update failed.', error);
    return Response.json(
      { error: 'We could not update your profile right now.' },
      { status: 503 },
    );
  }
}
