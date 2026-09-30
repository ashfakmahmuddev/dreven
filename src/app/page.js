"use client";
import { useState, useEffect } from "react";

export default function LandingPage() {
  // স্লাইডার ব্যানার ডেটা
  const banners = [
    {
      id: 1,
      title: "ফিলিস্তিনি ক্যাফিয়া ও সুগন্ধি আতর",
      subtitle: "অরিজিনাল ফিলিস্তিনি ক্যাফিয়া এবং সেরা মানের আতর কালেকশন",
      bgColor: "bg-emerald-800",
    },
    {
      id: 2,
      title: "প্রিমিয়াম ইসলামিক জুব্বা ও পাঞ্জাবি",
      subtitle: "আরামদায়ক কাপড়ে তৈরি এক্সক্লুসিভ ডিজাইন",
      bgColor: "bg-slate-800",
    },
    {
      id: 3,
      title: "হালাল টি-শার্ট ও প্রিমিয়াম টুপি",
      subtitle: "প্রতিদিনের ব্যবহারের জন্য সেরা মানের ইসলামিক পোশাক",
      bgColor: "bg-teal-900",
    },
  ];

  // ক্যাটাগরি ডেটা
  const categories = [
    { id: 1, name: "ক্যাফিয়া ও টুপি" },
    { id: 2, name: "সুগন্ধি আতর" },
    { id: 3, name: "জুব্বা ও পাঞ্জাবি" },
    { id: 4, name: "ইসলামিক টি-শার্ট" },
  ];

  // ডামি প্রোডাক্ট ডেটা (কার্ড স্টাইল পরে যোগ করার জন্য)
  const dummyProducts = [1, 2, 3, 4, 5, 6, 7, 8];

  // স্লাইডার লজিক
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000); // প্রতি ৫ সেকেন্ডে স্লাইড চেঞ্জ হবে
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* ১. হিরো ব্যানার স্লাইডার */}
      <section className="relative w-full h-[400px] overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 flex flex-col items-center justify-center text-white text-center px-4 ${
              banner.bgColor
            } ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{banner.title}</h1>
            <p className="text-lg md:text-xl max-w-2xl">{banner.subtitle}</p>
          </div>
        ))}
        
        {/* স্লাইডার ইন্ডিকেটর (ডট) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ২. ক্যাটাগরি সেকশন */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">আমাদের ক্যাটাগরি</h2>
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
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">জনপ্রিয় কালেকশন</h2>
        
        {/* প্রোডাক্ট গ্রিড (ডেস্কটপে ৪টা করে কার্ড) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dummyProducts.map((item) => (
            <div
              key={item}
              className="bg-white h-80 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
            >
              {/* এখানে আপনার প্রোডাক্ট কার্ডের ডিজাইন বসবে */}
              <p>প্রোডাক্ট কার্ড {item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}