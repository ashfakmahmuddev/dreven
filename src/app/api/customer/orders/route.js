import { getDatabase } from '../../../../lib/mongodb';
import { getCustomerSession } from '../../../../lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const customerId = await getCustomerSession();
    if (!customerId) {
      return Response.json({ error: 'Please sign in to view your orders.' }, { status: 401 });
    }

    const database = await getDatabase();
    const orders = await database.collection('orders')
      .find(
        { customerId },
        {
          projection: {
            _id: 0,
            customerId: 0,
            customer: 0,
            email: 0,
            phone: 0,
            note: 0,
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      orders: orders.map((order) => ({
        ...order,
        date: new Date(order.createdAt).toLocaleString('en-BD'),
      })),
    });
  } catch (error) {
    console.error('Could not load customer orders.', error);
    return Response.json(
      { error: 'Your orders are temporarily unavailable.' },
      { status: 503 },
    );
  }
}
