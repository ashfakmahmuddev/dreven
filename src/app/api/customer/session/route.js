import { getDatabase } from '../../../../lib/mongodb';
import { getCustomerSession } from '../../../../lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getCustomerSession();
    if (!userId) return Response.json({ user: null });

    const database = await getDatabase();
    const user = await database.collection('customers').findOne(
      { _id: userId },
      { projection: { name: 1, email: 1 } },
    );
    if (!user) return Response.json({ user: null });

    return Response.json({ user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Could not load customer session.', error);
    return Response.json(
      { error: 'Account details are temporarily unavailable.' },
      { status: 503 },
    );
  }
}
