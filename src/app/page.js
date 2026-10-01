import HeroCarousel from "../components/HeroCarousel";

export default function LandingPage() {
  const categories = [
    { id: 1, name: "Keffiyehs & Caps" },
    { id: 2, name: "Attar & Fragrance" },
    { id: 3, name: "Jubbas & Panjabis" },
    { id: 4, name: "Islamic T-Shirts" },
  ];

  const dummyProducts = [1, 2, 3, 4, 5, 6, 7, 8];

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
        
        {/* প্রোডাক্ট গ্রিড (ডেস্কটপে ৪টা করে কার্ড) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dummyProducts.map((item) => (
            <div
              key={item}
              className="bg-white h-80 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
            >
              {/* এখানে আপনার প্রোডাক্ট কার্ডের ডিজাইন বসবে */}
              <p>Product {item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}