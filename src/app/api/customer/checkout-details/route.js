import { getDatabase } from '../../../../lib/mongodb';
import { getCustomerSession } from '../../../../lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const customerId = await getCustomerSession();
    if (!customerId) {
      return Response.json({ error: 'Please sign in to load your previous delivery details.' }, { status: 401 });
    }

    const database = await getDatabase();
    const order = await database.collection('orders').findOne(
      { customerId },
      {
        projection: {
          _id: 0,
          customer: 1,
          phone: 1,
          email: 1,
          address: 1,
          city: 1,
          upazila: 1,
        },
        sort: { createdAt: -1 },
      },
    );

    if (!order) return Response.json({ details: null });

    return Response.json({
      details: {
        name: order.customer || '',
        phone: order.phone || '',
        email: order.email || '',
        address: order.address || '',
        district: order.city || '',
        upazila: order.upazila || '',
      },
    });
  } catch (error) {
    console.error('Could not load the customer’s previous checkout details.', error);
    return Response.json(
      { error: 'Previous delivery details are temporarily unavailable.' },
      { status: 503 },
    );
  }
}
