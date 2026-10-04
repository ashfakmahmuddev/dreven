import { randomUUID } from 'node:crypto';
import { getDatabase, getMongoClient } from '../../../lib/mongodb';
import { getCustomerSession } from '../../../lib/customer-auth';
import {
  deliveryFeesByZone,
  getDeliveryZoneForDistrict,
} from '../../../lib/bangladesh-districts';
import { isValidUpazila } from '../../../lib/bangladesh-upazilas';
import { attarSizesMl, getAttarPrices, isAttarProduct } from '../../../lib/product-pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const maximumLineItems = 30;
const maximumQuantity = 20;

function errorResponse(error, status = 400) {
  return Response.json({ error }, { status });
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('অর্ডারের তথ্য সঠিকভাবে পাঠানো যায়নি। আবার চেষ্টা করুন।');
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const address = typeof body?.address === 'string' ? body.address.trim() : '';
  const city = typeof body?.city === 'string' ? body.city.trim() : '';
  const upazila = typeof body?.upazila === 'string' ? body.upazila.trim() : '';
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  const deliveryZone = getDeliveryZoneForDistrict(city);
  const requestedItems = body?.items;

  if (!validText(name, 100)) return errorResponse('আপনার নাম লিখুন (সর্বোচ্চ ১০০ অক্ষর)।');
  if (phone.length < 7 || phone.length > 30) return errorResponse('সঠিক ফোন নম্বর লিখুন।');
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return errorResponse('সঠিক ইমেইল ঠিকানা লিখুন।');
  }
  if (!validText(address, 500)) return errorResponse('সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।');
  if (!deliveryZone) return errorResponse('বাংলাদেশের সঠিক একটি জেলা বেছে নিন।');
  if (!isValidUpazila(city, upazila)) return errorResponse('নির্বাচিত জেলার জন্য সঠিক উপজেলা বেছে নিন।');
  if (note.length > 500) return errorResponse('অর্ডার নোট ৫০০ অক্ষরের মধ্যে লিখুন।');
  if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > maximumLineItems) {
    return errorResponse('আপনার কার্টে অর্ডার করার মতো পণ্য নেই।');
  }

  const quantities = new Map();
  for (const item of requestedItems) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > maximumQuantity ||
      (item.sizeMl !== undefined && !attarSizesMl.includes(item.sizeMl))
    ) {
      return errorResponse('কার্টের পণ্যের তথ্য সঠিক নয়। কার্ট আবার দেখে নিন।');
    }
    const lineKey = `${item.id}:${item.sizeMl ?? 'standard'}`;
    quantities.set(lineKey, {
      id: item.id,
      sizeMl: item.sizeMl,
      quantity: (quantities.get(lineKey)?.quantity || 0) + item.quantity,
    });
  }
  if ([...quantities.values()].some((item) => item.quantity > maximumQuantity)) {
    return errorResponse('একটি পণ্যের সর্বোচ্চ অর্ডার পরিমাণ ২০টি।');
  }

  let customerId = null;
  try {
    customerId = await getCustomerSession();
  } catch (error) {
    console.error('Could not read customer session during order placement.', error);
  }

  let session;
  let placedOrder;

  try {
    const client = await getMongoClient();
    const database = await getDatabase();
    session = client.startSession();
    await session.withTransaction(async () => {
      const productsCollection = database.collection('products');
      const orderItems = [];
      const stockDeductions = new Map();
      let subtotal = 0;

      for (const { id, sizeMl, quantity } of quantities.values()) {
        const product = await productsCollection.findOne({ id }, { session });
        if (!product) throw new Error(`UNAVAILABLE:${id}`);

        const isAttar = isAttarProduct(product);
        const selectedSizeMl = isAttar ? (sizeMl ?? 3) : sizeMl;
        if ((isAttar && !attarSizesMl.includes(selectedSizeMl)) || (!isAttar && sizeMl !== undefined)) {
          throw new Error('INVALID_VARIANT');
        }

        const price = Number(isAttar ? getAttarPrices(product)[selectedSizeMl] : product.price);
        if (!Number.isFinite(price) || price < 0) throw new Error('INVALID_PRICE');

        orderItems.push({
          id: product.id,
          name: product.name,
          image: product.image || '/dreven_dv.png',
          price,
          quantity,
          ...(isAttar ? { sizeMl: selectedSizeMl } : {}),
        });
        subtotal += price * quantity;
        stockDeductions.set(id, (stockDeductions.get(id) || 0) + quantity);
      }

      for (const [id, quantity] of stockDeductions) {
        const product = await productsCollection.findOne({ id }, { session });
        if (!Number.isInteger(product?.stock) || product.stock < quantity) {
          throw new Error(`STOCK:${product?.name || id}`);
        }
      }

      const now = new Date();
      placedOrder = {
        id: `DV-${randomUUID().slice(0, 8).toUpperCase()}`,
        customerId,
        customer: name,
        email,
        phone,
        address,
        city,
        upazila,
        deliveryZone,
        note,
        items: orderItems,
        itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        deliveryFee: deliveryFeesByZone[deliveryZone],
        total: subtotal + deliveryFeesByZone[deliveryZone],
        paymentMethod: 'Cash on delivery',
        status: 'Pending',
        createdAt: now,
      };

      for (const [id, quantity] of stockDeductions) {
        const product = orderItems.find((item) => item.id === id);
        const result = await productsCollection.updateOne(
          { id, stock: { $gte: quantity } },
          { $inc: { stock: -quantity }, $set: { updatedAt: now } },
          { session },
        );
        if (result.modifiedCount !== 1) throw new Error(`STOCK:${product?.name || id}`);
      }

      await database.collection('orders').insertOne(placedOrder, { session });
    });

    return Response.json(
      {
        order: {
          id: placedOrder.id,
          itemCount: placedOrder.itemCount,
          subtotal: placedOrder.subtotal,
          deliveryFee: placedOrder.deliveryFee,
          total: placedOrder.total,
          status: placedOrder.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.message === 'INVALID_VARIANT') {
      return errorResponse('পণ্যের নির্বাচিত সাইজটি সঠিক নয়। কার্ট আবার দেখে নিন।');
    }
    if (error.message?.startsWith('UNAVAILABLE:')) {
      return errorResponse('কার্টের একটি পণ্য আর পাওয়া যাচ্ছে না। কার্ট আপডেট করে আবার চেষ্টা করুন।', 409);
    }
    if (error.message?.startsWith('STOCK:')) {
      return errorResponse(`“${error.message.slice(6)}” পণ্যের পর্যাপ্ত স্টক নেই। কার্টের পরিমাণ কমিয়ে আবার চেষ্টা করুন।`, 409);
    }
    if (error.message === 'INVALID_PRICE') {
      console.error('An invalid price was found while placing an order.');
      return errorResponse('একটি পণ্যের মূল্য যাচাই করা যায়নি। অনুগ্রহ করে সহায়তায় যোগাযোগ করুন।', 503);
    }

    console.error('Could not place the COD order.', error);
    return errorResponse('অর্ডার জমা দেওয়া যায়নি। ডেটাবেস সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', 503);
  } finally {
    if (session) await session.endSession();
  }
}
