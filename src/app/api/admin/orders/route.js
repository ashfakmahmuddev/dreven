import { getDatabase, getMongoClient } from '../../../../lib/mongodb';
import { isAdminAuthenticated } from '../../../../lib/admin-auth';
import { attarSizesMl, getAttarPrices, isAttarProduct } from '../../../../lib/product-pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const orderStatuses = new Set(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);
const maximumLineItems = 30;
const maximumQuantity = 20;

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
  const updatesStatus = orderStatuses.has(body?.status);
  const updatesItems = Array.isArray(body?.items);
  if (
    typeof body?.id !== 'string' ||
    !body.id ||
    (!updatesStatus && !updatesItems)
  ) {
    return Response.json({ error: 'Order ID or update details are not valid.' }, { status: 400 });
  }

  let requestedItems;
  if (updatesItems) {
    if (body.items.length < 1 || body.items.length > maximumLineItems) {
      return Response.json({ error: `An order must contain between 1 and ${maximumLineItems} items.` }, { status: 400 });
    }
    const quantities = new Map();
    for (const item of body.items) {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > maximumQuantity ||
        (item.sizeMl !== undefined && !attarSizesMl.includes(item.sizeMl))
      ) {
        return Response.json({ error: 'An item or quantity is not valid.' }, { status: 400 });
      }
      const key = `${item.id}:${item.sizeMl ?? 'standard'}`;
      const quantity = (quantities.get(key)?.quantity || 0) + item.quantity;
      if (quantity > maximumQuantity) {
        return Response.json({ error: 'The maximum quantity per product size is 20.' }, { status: 400 });
      }
      quantities.set(key, { id: item.id, sizeMl: item.sizeMl, quantity });
    }
    requestedItems = [...quantities.values()];
  }

  try {
    const client = await getMongoClient();
    const database = await getDatabase();
    const session = client.startSession();
    let missingOrder = false;
    let insufficientStock = null;
    let updatedOrder = null;
    try {
      await session.withTransaction(async () => {
        const orders = database.collection('orders');
        const products = database.collection('products');
        const order = await orders.findOne({ id: body.id }, { session });
        if (!order) {
          missingOrder = true;
          return;
        }

        const now = new Date();
        if (updatesItems) {
          const oldItems = Array.isArray(order.items) ? order.items : [];
          const oldItemsByKey = new Map(
            oldItems.map((item) => [`${item.id}:${item.sizeMl ?? 'standard'}`, item]),
          );
          const nextItems = [];
          const oldQuantities = new Map();
          const nextQuantities = new Map();

          for (const item of oldItems) {
            oldQuantities.set(item.id, (oldQuantities.get(item.id) || 0) + item.quantity);
          }

          for (const item of requestedItems) {
            const product = await products.findOne({ id: item.id }, { session });
            if (!product) throw new Error(`ORDER_PRODUCT_NOT_FOUND:${item.id}`);

            const isAttar = isAttarProduct(product);
            const sizeMl = isAttar ? (item.sizeMl ?? 3) : undefined;
            if ((isAttar && !attarSizesMl.includes(sizeMl)) || (!isAttar && item.sizeMl !== undefined)) {
              throw new Error('ORDER_INVALID_VARIANT');
            }
            const key = `${item.id}:${sizeMl ?? 'standard'}`;
            const previousItem = oldItemsByKey.get(key);
            const currentPrice = Number(isAttar ? getAttarPrices(product)[sizeMl] : product.price);
            const price = previousItem && Number.isFinite(Number(previousItem.price))
              ? Number(previousItem.price)
              : currentPrice;
            if (!Number.isFinite(price) || price < 0) throw new Error('ORDER_INVALID_PRICE');

            nextItems.push({
              id: product.id,
              name: product.name,
              image: product.image || '/dreven_dv.png',
              price,
              quantity: item.quantity,
              ...(isAttar ? { sizeMl } : {}),
            });
            nextQuantities.set(product.id, (nextQuantities.get(product.id) || 0) + item.quantity);
          }

          if (order.status !== 'Cancelled') {
            const productIds = new Set([...oldQuantities.keys(), ...nextQuantities.keys()]);
            for (const id of productIds) {
              const difference = (nextQuantities.get(id) || 0) - (oldQuantities.get(id) || 0);
              if (difference === 0) continue;
              const product = await products.findOne({ id }, { session });
              if (!product) throw new Error(`ORDER_PRODUCT_NOT_FOUND:${id}`);

              if (difference > 0) {
                const result = await products.updateOne(
                  { id, stock: { $gte: difference } },
                  { $inc: { stock: -difference }, $set: { updatedAt: now } },
                  { session },
                );
                if (result.modifiedCount !== 1) {
                  insufficientStock = product.name;
                  throw new Error('ORDER_INSUFFICIENT_STOCK');
                }
              } else {
                await products.updateOne(
                  { id },
                  { $inc: { stock: -difference }, $set: { updatedAt: now } },
                  { session },
                );
              }
            }
          }

          const subtotal = nextItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const deliveryFee = Number(order.deliveryFee) || 0;
          updatedOrder = {
            ...order,
            items: nextItems,
            itemCount: nextItems.reduce((sum, item) => sum + item.quantity, 0),
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee,
            updatedAt: now,
          };
          const result = await orders.updateOne(
            { id: body.id, status: order.status },
            {
              $set: {
                items: updatedOrder.items,
                itemCount: updatedOrder.itemCount,
                subtotal: updatedOrder.subtotal,
                total: updatedOrder.total,
                updatedAt: now,
              },
            },
            { session },
          );
          if (result.matchedCount !== 1) throw new Error('ORDER_CHANGED');
        } else if (order.status !== body.status) {
          if (body.status === 'Cancelled' && order.status !== 'Cancelled') {
            for (const item of order.items || []) {
              await products.updateOne(
                { id: item.id },
                { $inc: { stock: item.quantity }, $set: { updatedAt: now } },
                { session },
              );
            }
          } else if (order.status === 'Cancelled' && body.status !== 'Cancelled') {
            for (const item of order.items || []) {
              const result = await products.updateOne(
                { id: item.id, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity }, $set: { updatedAt: now } },
                { session },
              );
              if (result.modifiedCount !== 1) {
                insufficientStock = item.name;
                throw new Error('ORDER_RESTOCK_FAILED');
              }
            }
          }

          const result = await orders.updateOne(
            { id: body.id, status: order.status },
            { $set: { status: body.status, updatedAt: now } },
            { session },
          );
          if (result.matchedCount !== 1) throw new Error('ORDER_CHANGED');
        }
      });
    } catch (error) {
      if (!insufficientStock) {
        if (error.message === 'ORDER_INVALID_VARIANT') {
          return Response.json({ error: 'The selected product size is not valid for that product.' }, { status: 400 });
        }
        if (error.message === 'ORDER_INVALID_PRICE') {
          console.error('An invalid product price was found while updating an order.');
          return Response.json({ error: 'A product price could not be verified.' }, { status: 503 });
        }
        if (error.message.startsWith('ORDER_PRODUCT_NOT_FOUND:')) {
          return Response.json({ error: 'A selected product is no longer available.' }, { status: 409 });
        }
        if (error.message === 'ORDER_INSUFFICIENT_STOCK') {
          return Response.json({ error: `There is not enough stock for ${insufficientStock}.` }, { status: 409 });
        }
        if (error.message === 'ORDER_CHANGED') {
          return Response.json({ error: 'This order changed while you were editing it. Reload the order and try again.' }, { status: 409 });
        }
        throw error;
      }
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
    if (updatesItems) {
      const { _id, customerId, ...orderResponse } = updatedOrder;
      return Response.json({ updated: true, order: orderResponse });
    }
    return Response.json({ updated: true });
  } catch (error) {
    console.error('Could not update customer order status.', error);
    return Response.json({ error: 'Order status could not be saved.' }, { status: 503 });
  }
}
