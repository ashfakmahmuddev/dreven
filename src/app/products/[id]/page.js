import { notFound } from 'next/navigation';
import ProductDetails from '../../../components/ProductDetails';
import { ensureDefaultProducts, getProductCollection } from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return { title: 'Product not found' };

  try {
    await ensureDefaultProducts();
    const product = await (await getProductCollection()).findOne(
      { id },
      { projection: { name: 1, category: 1 } },
    );
    return product
      ? { title: product.name, description: `${product.name} — ${product.category} at Dreven.` }
      : { title: 'Product not found' };
  } catch (error) {
    console.error('Could not load product metadata.', error);
    return { title: 'Product details | Dreven' };
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) notFound();

  await ensureDefaultProducts();
  const product = await (await getProductCollection()).findOne(
    { id },
    { projection: { _id: 0 } },
  );
  if (!product) notFound();

  return <ProductDetails product={product} />;
}
