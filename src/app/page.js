import Link from 'next/link';
import HeroCarousel from '../components/HeroCarousel';
import Product from '../components/Product';
import { ensureDefaultProducts, getProductCollection } from '../lib/mongodb';

export const dynamic = 'force-dynamic';

const fallbackProducts = [
  {
    id: 'PR-1001',
    name: 'Oud Al Layl',
    category: 'Attar & Fragrance',
    price: 1250,
    stock: 24,
    image: '/attor/Oud-Al-Layl.jpeg',
  },
  {
    id: 'PR-1002',
    name: 'Ameer Al Oud',
    category: 'Attar & Fragrance',
    price: 1450,
    stock: 8,
    image: '/attor/Ameer-Al-Oud.jpeg',
  },
  {
    id: 'PR-1003',
    name: 'Hawas Fire',
    category: 'Attar & Fragrance',
    price: 1100,
    stock: 3,
    image: '/attor/Hawas-Fire.jpeg',
  },
  {
    id: 'PR-1004',
    name: 'Vampire Blood',
    category: 'Attar & Fragrance',
    price: 990,
    stock: 16,
    image: '/attor/Vampire-Blood.jpeg',
  },
];

const categoryDetails = {
  'Attar & Fragrance': { eyebrow: 'Scent, thoughtfully chosen', number: '01' },
  'Jubbas & Panjabis': { eyebrow: 'Comfort with purpose', number: '02' },
  'Keffiyehs & Caps': { eyebrow: 'Everyday expressions', number: '03' },
  'Islamic T-Shirts': { eyebrow: 'Easy, considered essentials', number: '04' },
  Other: { eyebrow: 'More from Dreven', number: '05' },
};

export default async function LandingPage() {
  let products = fallbackProducts;
  let catalogUnavailable = false;

  try {
    await ensureDefaultProducts();
    const collection = await getProductCollection();
    products = await collection
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error('Could not load the live product catalogue.', error);
    catalogUnavailable = true;
  }

  const categoryCounts = products.reduce((counts, product) => {
    const category = product.category || 'Other';
    counts.set(category, (counts.get(category) || 0) + 1);
    return counts;
  }, new Map());
  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      ...(categoryDetails[name] || categoryDetails.Other),
    }))
    .sort((a, b) => Number(a.number) - Number(b.number));
  const featuredProducts = products.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#f7f7f3] pb-16">
      <HeroCarousel />

      <section className="border-b border-[#e8e9e2] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#e8e9e2] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-12">
          {[
            ['Thoughtfully selected', 'Products chosen with care'],
            ['Easy, secure ordering', 'Simple checkout, no account needed'],
            ['Cash on delivery', 'Pay when your order arrives'],
          ].map(([title, description]) => (
            <div key={title} className="flex items-center gap-4 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7f1eb] text-sm text-[#08765b]" aria-hidden="true">
                ✓
              </span>
              <div>
                <h2 className="text-xs font-semibold text-[#17231f]">{title}</h2>
                <p className="mt-1 text-xs text-[#748079]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#08765b]">Find your kind of essential</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-.035em] text-[#17231f] sm:text-3xl">
              Shop by collection
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden text-xs font-semibold uppercase tracking-[.12em] text-[#08765b] transition-colors hover:text-[#17231f] sm:inline-flex"
          >
            View all collections <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group flex min-h-36 flex-col justify-between border border-[#e3e7df] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#9cb7a8] hover:shadow-[0_12px_30px_rgba(23,35,31,.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08765b] sm:min-h-40 sm:p-6"
            >
              <span className="flex items-start justify-between">
                <span className="text-[10px] font-semibold tracking-[.18em] text-[#87938c]">{category.number}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e3e7df] text-sm text-[#52665b] transition-colors group-hover:border-[#08765b] group-hover:bg-[#08765b] group-hover:text-white" aria-hidden="true">↗</span>
              </span>
              <span>
                <span className="block text-base font-medium text-[#17231f]">{category.name}</span>
                <span className="mt-1 block text-xs text-[#748079]">{category.eyebrow}</span>
                <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[.13em] text-[#08765b]">
                  {category.count} {category.count === 1 ? 'piece' : 'pieces'}
                </span>
              </span>
            </Link>
          ))}
        </div>
        <Link
          href="/shop"
          className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[.12em] text-[#08765b] sm:hidden"
        >
          View all collections <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-5 sm:mt-14 sm:px-8 lg:px-12">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#08765b]">A few favourites</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-.035em] text-[#17231f] sm:text-3xl">
              Popular right now
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#748079]">
              Find something you love. Quick add to your cart, or open a product to explore every detail.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden min-h-11 items-center justify-center border border-[#cfd8d1] px-4 text-[10px] font-semibold uppercase tracking-[.14em] text-[#17231f] transition-colors hover:border-[#08765b] hover:bg-[#08765b] hover:text-white sm:inline-flex"
          >
            Shop everything
          </Link>
        </div>

        {catalogUnavailable && (
          <p role="status" className="mb-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Live products could not be loaded. Showing the featured collection instead.
          </p>
        )}

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-0 max-[374px]:grid-cols-1 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Product key={product.id} product={{ ...product, title: product.name }} />
            ))}
          </div>
        ) : (
          <p className="border border-[#e3e7df] bg-white px-5 py-12 text-center text-sm text-[#748079]">
            New pieces are on their way. Please check back soon.
          </p>
        )}

        <Link
          href="/shop"
          className="mt-6 flex min-h-12 items-center justify-center border border-[#cfd8d1] px-5 text-xs font-semibold uppercase tracking-[.14em] text-[#17231f] transition-colors hover:border-[#08765b] hover:bg-[#08765b] hover:text-white sm:hidden"
        >
          Shop the full collection
        </Link>
      </section>
    </main>
  );
}
