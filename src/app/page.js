import HeroCarousel from "../components/HeroCarousel";
import Product from "../components/Product";
import { ensureDefaultProducts, getProductCollection } from "../lib/mongodb";

export const dynamic = "force-dynamic";

const fallbackProducts = [
  {
    id: "PR-1001",
    name: "Oud Al Layl",
    category: "Attar & Fragrance",
    price: 1250,
    stock: 24,
    image: "/attor/Oud-Al-Layl.jpeg",
  },
  {
    id: "PR-1002",
    name: "Ameer Al Oud",
    category: "Attar & Fragrance",
    price: 1450,
    stock: 8,
    image: "/attor/Ameer-Al-Oud.jpeg",
  },
  {
    id: "PR-1003",
    name: "Hawas Fire",
    category: "Attar & Fragrance",
    price: 1100,
    stock: 3,
    image: "/attor/Hawas-Fire.jpeg",
  },
  {
    id: "PR-1004",
    name: "Vampire Blood",
    category: "Attar & Fragrance",
    price: 990,
    stock: 16,
    image: "/attor/Vampire-Blood.jpeg",
  },
];

export default async function LandingPage() {
  const categories = [
    { id: 1, name: "Keffiyehs & Caps" },
    { id: 2, name: "Attar & Fragrance" },
    { id: 3, name: "Jubbas & Panjabis" },
    { id: 4, name: "Islamic T-Shirts" },
  ];

  let products = fallbackProducts.filter((product) => product.stock > 0);
  let catalogUnavailable = false;

  try {
    await ensureDefaultProducts();
    const collection = await getProductCollection();
    products = await collection
      .find({ stock: { $gt: 0 } }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error("Could not load the live product catalogue.", error);
    catalogUnavailable = true;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <HeroCarousel />

      {/* ২. ক্যাটাগরি সেকশন */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white py-6 px-4 rounded-xl shadow-sm border border-gray-100 text-center cursor-pointer hover:shadow-md hover:border-emerald-500 transition-all group"
            >
              <h3 className="text-lg font-semibold text-gray-700 group-hover:text-emerald-600">
                {category.name}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ৩. প্রোডাক্ট সেকশন */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Popular Collections</h2>
        {catalogUnavailable && (
          <p role="status" className="mb-5 text-center text-sm text-amber-800">
            Live products could not be loaded. Showing the featured collection instead.
          </p>
        )}
        
        {/* প্রোডাক্ট গ্রিড (ডেস্কটপে ৪টা করে কার্ড) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Product key={product.id} product={{ ...product, title: product.name }} />
          ))}
        </div>
      </section>
    </main>
  );
}