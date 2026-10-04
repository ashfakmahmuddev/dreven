import ShopCatalog from '../../components/ShopCatalog';
import { ensureDefaultProducts, getProductCollection } from '../../lib/mongodb';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop the collection',
  description: 'Browse Dreven attar, Islamic clothing and accessories. Filter the collection and order online with cash on delivery.',
};

export default async function ShopPage({ searchParams }) {
  const query = await searchParams;
  const requestedCategory = typeof query?.category === 'string' ? query.category : '';
  const requestedSearch = typeof query?.search === 'string' ? query.search : '';
  let products = [];
  let catalogUnavailable = false;

  try {
    await ensureDefaultProducts();
    const collection = await getProductCollection();
    products = await collection
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error('Could not load the shop catalogue.', error);
    catalogUnavailable = true;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f3] pb-16">
      <section className="border-b border-[#e3e7df] bg-[#edf2eb]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#08765b]">
            The Dreven collection
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-medium tracking-[-.045em] text-[#17231f] sm:text-4xl">
                Find your next favourite.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#65746b]">
                Explore fine attar, considered clothing and everyday essentials. Choose a piece and order in just a few steps.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-[.1em] text-[#52665b]">
              <span className="border border-[#d8e2d8] bg-white/70 px-3 py-2">Cash on delivery</span>
              <span className="border border-[#d8e2d8] bg-white/70 px-3 py-2">Delivery across Bangladesh</span>
            </div>
          </div>
        </div>
      </section>

      <ShopCatalog
        key={`${requestedCategory}:${requestedSearch}`}
        products={products}
        initialCategory={requestedCategory}
        initialQuery={requestedSearch}
        catalogUnavailable={catalogUnavailable}
      />
    </main>
  );
}
