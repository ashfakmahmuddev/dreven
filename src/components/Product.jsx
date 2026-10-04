'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Product({ product }) {
  const { id, title, category, price, image, label } = product;
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState('');

  function addToCart() {
    try {
      const savedCart = window.localStorage.getItem('dreven-cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];
      if (!Array.isArray(cart)) {
        throw new Error('Saved cart data is not valid.');
      }

      const existingProduct = cart.find((item) => item.id === id);
      const nextCart = existingProduct
        ? cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...cart, { id, title, price, image, quantity: 1 }];

      window.localStorage.setItem('dreven-cart', JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dreven-cart-updated'));
      setAdded(true);
      setMessage(`${title} added to your cart.`);
    } catch {
      setAdded(false);
      setMessage('Could not add this product to your cart. Please try again.');
    }
  }

  return (
    <article className="group overflow-hidden border border-neutral-200 bg-white p-2 transition-colors duration-200 hover:border-neutral-400">
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
          unoptimized
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div className="px-2 pb-2 pt-4 text-center sm:px-3 sm:pt-5">
        <p className="min-h-5 text-[9px] font-medium uppercase tracking-[.16em] text-neutral-500">{category}</p>
        <h3 className="mt-1 min-h-12 text-sm font-medium uppercase leading-6 tracking-wide text-neutral-900 sm:text-base">{title}</h3>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-800">
          ৳{Number(price).toLocaleString('en-BD')}
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={addToCart}
            className={`w-full border px-3 py-3 text-[10px] font-semibold uppercase tracking-[.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:py-3.5 ${added ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white text-black hover:border-black hover:bg-black hover:text-white'}`}
          >
            {added ? 'Added to cart ✓' : 'Quick add'}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{message}</p>
    </article>
  );
}
