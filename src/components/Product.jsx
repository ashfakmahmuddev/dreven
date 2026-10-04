'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getAttarPrices, getNamedAttarImage, isAttarProduct } from '../lib/product-pricing';

export default function Product({ product }) {
  const { id, title, category, price, image } = product;
  const isOutOfStock = !Number.isFinite(Number(product.stock)) || Number(product.stock) <= 0;
  const isAttar = isAttarProduct(product);
  const attarPrices = isAttar ? getAttarPrices(product) : null;
  const hoverImage = isAttar ? getNamedAttarImage(title) : null;
  const startingPrice = isAttar ? Math.min(...Object.values(attarPrices)) : price;
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState('');

  function openDetails() {
    router.push(`/products/${encodeURIComponent(id)}`);
  }

  function addToCart() {
    if (isOutOfStock) {
      setAdded(false);
      setMessage(`${title} is out of stock and cannot be added to your cart.`);
      return;
    }

    try {
      const savedCart = window.localStorage.getItem('dreven-cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];
      if (!Array.isArray(cart)) {
        throw new Error('Saved cart data is not valid.');
      }

      const productQuantityInCart = cart
        .filter((item) => item.id === id)
        .reduce((total, item) => total + item.quantity, 0);
      if (productQuantityInCart + 1 > Number(product.stock)) {
        setAdded(false);
        setMessage(`Only ${product.stock} item${Number(product.stock) === 1 ? '' : 's'} available.`);
        return;
      }

      const quickAddPrice = isAttar ? attarPrices[3] : price;
      const matchingProduct = cart.find(
        (item) => item.id === id && (item.sizeMl || null) === (isAttar ? 3 : null),
      );
      const nextCart = matchingProduct
        ? cart.map((item) => item.id === id && (item.sizeMl || null) === (isAttar ? 3 : null)
          ? { ...item, quantity: item.quantity + 1, price: quickAddPrice }
          : item)
        : [...cart, {
          id,
          title,
          price: quickAddPrice,
          image,
          quantity: 1,
          ...(isAttar ? { sizeMl: 3 } : {}),
        }];

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
    <article
      role="link"
      tabIndex={0}
      aria-label={`View details for ${title}`}
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          openDetails();
        }
      }}
      className="group overflow-hidden border border-[#e3e7df] bg-white p-2 shadow-[0_2px_12px_rgba(23,35,31,.025)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b7c9bc] hover:shadow-[0_14px_34px_rgba(23,35,31,.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08765b]"
    >
      <div className="relative aspect-square overflow-hidden bg-[#f1f2ed]">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 374px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 50vw, 25vw"
          unoptimized
          className={`object-cover transition-all duration-500 ease-out group-hover:scale-[1.03] ${hoverImage ? 'group-hover:opacity-0' : ''}`}
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${title} alternate product image`}
            fill
            sizes="(max-width: 374px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 50vw, 25vw"
            unoptimized
            className="object-cover opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
          />
        )}
        {isOutOfStock && (
          <span className="absolute left-3 top-3 bg-neutral-900/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="px-2 pb-2 pt-4 text-center sm:px-3 sm:pt-5">
        <p className="min-h-5 text-[9px] font-semibold uppercase tracking-[.16em] text-[#77847b]">{category}</p>
        <h3 className="mt-1 min-h-12 text-sm font-semibold uppercase leading-6 tracking-wide text-[#17231f] sm:text-base">{title}</h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#41534a]">
          {isAttar ? `From ৳${Number(startingPrice).toLocaleString('en-BD')} · 3ml` : `৳${Number(price).toLocaleString('en-BD')}`}
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              addToCart();
            }}
            disabled={isOutOfStock}
            className={`w-full border px-3 py-3 text-[10px] font-semibold uppercase tracking-[.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08765b] sm:py-3.5 ${isOutOfStock ? 'cursor-not-allowed border-[#e3e7df] bg-[#f1f2ed] text-[#77847b]' : added ? 'cursor-pointer border-[#08765b] bg-[#08765b] text-white' : 'cursor-pointer border-[#d6dfd7] bg-white text-[#17231f] hover:border-[#08765b] hover:bg-[#08765b] hover:text-white'}`}
          >
            {isOutOfStock ? 'Out of stock' : added ? 'Added to cart ✓' : 'Quick add'}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{message}</p>
    </article>
  );
}
