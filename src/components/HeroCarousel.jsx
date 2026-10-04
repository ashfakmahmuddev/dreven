"use client";

import { useEffect, useState } from "react";

const banners = [
  {
    id: 1,
    title: "Palestinian Keffiyehs & Fine Attar",
    subtitle: "Authentic Palestinian keffiyehs and a premium attar collection",
    bgColor: "bg-emerald-800",
  },
  {
    id: 2,
    title: "Premium Islamic Jubbas & Panjabis",
    subtitle: "Exclusive designs made with comfortable fabrics",
    bgColor: "bg-slate-800",
  },
  {
    id: 3,
    title: "Halal T-Shirts & Premium Caps",
    subtitle: "Quality Islamic apparel for everyday wear",
    bgColor: "bg-teal-900",
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Dreven Islamic clothing and fragrance collections"
      className="relative h-[400px] w-full overflow-hidden"
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          aria-hidden={index !== currentSlide}
          className={`absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white transition-opacity duration-1000 ${banner.bgColor} ${index === currentSlide ? "z-10 opacity-100" : "z-0 opacity-0"}`}
        >
          {index === currentSlide && (
            <h1 className="text-4xl font-bold md:text-5xl">
              Dreven | Islamic Clothing &amp; Attar in Bangladesh
            </h1>
          )}
          <h2 className="mb-4 mt-3 text-2xl font-semibold md:text-3xl">
            {banner.title}
          </h2>
          <p className="max-w-2xl text-lg md:text-xl">{banner.subtitle}</p>
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 space-x-2">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === currentSlide}
            onClick={() => setCurrentSlide(index)}
            className={`h-3 w-3 rounded-full transition-all ${
              index === currentSlide ? "scale-125 bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}