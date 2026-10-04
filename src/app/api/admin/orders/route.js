import { getDatabase, getMongoClient } from '../../../../lib/mongodb';
import { isAdminAuthenticated } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const orderStatuses = new Set(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);

async function getAuthError() {
  try {
    return await isAdminAuthenticated()
      ? null
      : Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  } catch (error) {
    console.error('Could not verify admin access to orders.', error);
    return Response.json({ error: 'Admin authentication is not configured correctly.' }, { status: 503 });
  }
}

export async function GET() {
  const authError = await getAuthError();
  if (authError) return authError;

  try {
    const database = await getDatabase();
    const orders = await database.collection('orders')
      .find({}, { projection: { _id: 0, customerId: 0 } })
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
    return Response.json({ error: 'Orders could not be loaded from the database.' }, { status: 503 });
  }
}

export async function PATCH(request) {
  const authError = await getAuthError();
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'A valid order update is required.' }, { status: 400 });
  }
  if (typeof body?.id !== 'string' || !body.id || !orderStatuses.has(body.status)) {
    return Response.json({ error: 'Order ID or status is not valid.' }, { status: 400 });
  }

  try {
    const client = await getMongoClient();
    const database = await getDatabase();
    const session = client.startSession();
    let missingOrder = false;
    let insufficientStock = null;
    try {
      await session.withTransaction(async () => {
        const orders = database.collection('orders');
        const products = database.collection('products');
        const order = await orders.findOne({ id: body.id }, { session });
        if (!order) {
          missingOrder = true;
          return;
        }
        if (order.status === body.status) return;

        if (body.status === 'Cancelled' && order.status !== 'Cancelled') {
          for (const item of order.items || []) {
            await products.updateOne(
              { id: item.id },
              { $inc: { stock: item.quantity }, $set: { updatedAt: new Date() } },
              { session },
            );
          }
        } else if (order.status === 'Cancelled' && body.status !== 'Cancelled') {
          for (const item of order.items || []) {
            const result = await products.updateOne(
              { id: item.id, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } },
              { session },
            );
            if (result.modifiedCount !== 1) {
              insufficientStock = item.name;
              throw new Error('ORDER_RESTOCK_FAILED');
            }
          }
        }

        await orders.updateOne(
          { id: body.id, status: order.status },
          { $set: { status: body.status, updatedAt: new Date() } },
          { session },
        );
      });
    } catch (error) {
      if (!insufficientStock) throw error;
    } finally {
      await session.endSession();
    }

    if (missingOrder) return Response.json({ error: 'Order not found.' }, { status: 404 });
    if (insufficientStock) {
      return Response.json(
        { error: `Cannot reopen this order because ${insufficientStock} no longer has enough stock.` },
        { status: 409 },
      );
    }
    return Response.json({ updated: true });
  } catch (error) {
    console.error('Could not update customer order status.', error);
    return Response.json({ error: 'Order status could not be saved.' }, { status: 503 });
  }
}
