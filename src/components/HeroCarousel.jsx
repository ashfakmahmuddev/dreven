'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const banners = [
  {
    eyebrow: 'Thoughtfully chosen · Made for everyday',
    title: 'A little more meaning in what you wear.',
    subtitle: 'Discover considered essentials, Palestinian keffiyehs and fine attar, selected for everyday life.',
    accent: '01 / CLOTHING & FRAGRANCE',
  },
  {
    eyebrow: 'A fragrance worth remembering',
    title: 'Find a scent that feels like yours.',
    subtitle: 'Explore Dreven attars in 3ml, 5ml and 10ml sizes, with easy cash-on-delivery ordering.',
    accent: '02 / FINE ATTAR',
  },
  {
    eyebrow: 'Comfort, with a point of view',
    title: 'Everyday pieces. Lasting purpose.',
    subtitle: 'Browse modest clothing and accessories made to feel right from the first wear.',
    accent: '03 / EVERYDAY ESSENTIALS',
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % banners.length);
    }, 6500);

    return () => clearInterval(timer);
  }, []);

  const banner = banners[currentSlide];

  return (
    <section
      aria-label="Discover Dreven"
      className="relative isolate overflow-hidden bg-[#17231f] text-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-36 -top-48 h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-28 h-[25rem] w-[25rem] rounded-full border border-white/10" />
        <div className="absolute -right-8 bottom-[-18rem] h-[34rem] w-[34rem] rounded-full bg-[#0b765a]/25 blur-3xl" />
        <div className="absolute inset-y-0 right-[17%] hidden w-px bg-white/[.07] lg:block" />
      </div>

      <div className="relative mx-auto grid min-h-[430px] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[500px] lg:grid-cols-[1.1fr_.9fr] lg:px-12">
        <div className="max-w-2xl">
          <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.24em] text-[#9dd4bb] sm:text-xs">
            <span className="h-px w-8 bg-[#9dd4bb]" />
            {banner.eyebrow}
          </p>
          <h1 className="max-w-2xl text-4xl font-medium leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-[4.25rem]">
            {banner.title}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            {banner.subtitle}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center bg-[#0b8a67] px-7 text-xs font-semibold uppercase tracking-[.14em] text-white transition-colors hover:bg-[#11a27a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore the collection
            </Link>
            <span className="px-2 text-[11px] tracking-wide text-white/50">
              Cash on delivery available
            </span>
          </div>
        </div>

        <div className="hidden min-h-64 flex-col justify-between border-l border-white/15 py-5 pl-8 lg:flex">
          <span className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/45">
            DREVEN · BANGLADESH
          </span>
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-[#9dd4bb]">{banner.accent}</p>
            <p className="mt-4 max-w-sm text-2xl font-light leading-relaxed text-white/85">
              Made for the moments that make a day yours.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {banners.map((item, index) => (
                <button
                  key={item.accent}
                  type="button"
                  aria-label={`Show collection slide ${index + 1}`}
                  aria-current={index === currentSlide}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 transition-all ${
                    index === currentSlide ? 'w-9 bg-[#9dd4bb]' : 'w-4 bg-white/25 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs tabular-nums text-white/45">
              0{currentSlide + 1} <span className="px-1">/</span> 0{banners.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {banners.map((item, index) => (
            <button
              key={item.accent}
              type="button"
              aria-label={`Show collection slide ${index + 1}`}
              aria-current={index === currentSlide}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 transition-all ${
                index === currentSlide ? 'w-9 bg-[#9dd4bb]' : 'w-4 bg-white/25'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
