import { ensureDefaultProducts, getProductCollection } from '../../../lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDefaultProducts();
    const collection = await getProductCollection();
    const products = await collection
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return Response.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Could not load storefront products.', error);
    return Response.json(
      { error: 'Products are temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
