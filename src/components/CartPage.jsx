'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function readCart() {
  const savedCart = window.localStorage.getItem('dreven-cart');
  const cart = savedCart ? JSON.parse(savedCart) : [];

  if (
    !Array.isArray(cart) ||
    cart.some(
      (item) =>
        !item ||
        typeof item.id !== 'string' ||
        typeof item.title !== 'string' ||
        typeof item.image !== 'string' ||
        !Number.isFinite(Number(item.price)) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        (item.sizeMl !== undefined && ![3, 5, 10].includes(item.sizeMl)),
    )
  ) {
    throw new Error('Saved cart data is not valid.');
  }

  return cart;
}

function formatPrice(price) {
  return `৳${Number(price).toLocaleString('en-BD')}`;
}

function getCartLineKey(item) {
  return `${item.id}:${item.sizeMl || 'standard'}`;
}

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const updateCart = () => {
      try {
        setCart(readCart());
        setError('');
      } catch (cartError) {
        console.error('Could not read the saved cart.', cartError);
        setError('We could not load your cart. Please refresh the page and try again.');
      } finally {
        setIsLoaded(true);
      }
    };

    updateCart();
    window.addEventListener('dreven-cart-updated', updateCart);
    window.addEventListener('storage', updateCart);

    return () => {
      window.removeEventListener('dreven-cart-updated', updateCart);
      window.removeEventListener('storage', updateCart);
    };
  }, []);

  function saveCart(nextCart) {
    try {
      window.localStorage.setItem('dreven-cart', JSON.stringify(nextCart));
      setCart(nextCart);
      setError('');
      window.dispatchEvent(new Event('dreven-cart-updated'));
    } catch (cartError) {
      console.error('Could not update the saved cart.', cartError);
      setError('Your cart could not be updated. Please try again.');
    }
  }

  function updateQuantity(id, change) {
    const nextCart = cart
      .map((item) =>
        getCartLineKey(item) === id
          ? { ...item, quantity: item.quantity + change }
          : item,
      )
      .filter((item) => item.quantity > 0);
    saveCart(nextCart);
  }

  function removeItem(id) {
    saveCart(cart.filter((item) => getCartLineKey(item) !== id));
  }

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-[#fafaf8] px-4 py-10 text-neutral-900 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 border-b border-neutral-200 pb-6 sm:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-neutral-500">
            Your selection
          </p>
          <h1 className="text-3xl font-medium uppercase tracking-wide sm:text-4xl">
            Shopping cart
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            {isLoaded ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Loading your items'}
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!isLoaded ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="h-48 animate-pulse bg-neutral-100" />
            <div className="h-64 animate-pulse bg-neutral-100" />
          </div>
        ) : error ? (
          <section className="flex min-h-56 flex-col items-center justify-center border border-neutral-200 bg-white px-6 py-12 text-center">
            <h2 className="text-xl font-medium uppercase tracking-wide">Cart unavailable</h2>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 min-h-12 bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              Try again
            </button>
          </section>
        ) : cart.length === 0 ? (
          <section className="flex min-h-72 flex-col items-center justify-center border border-neutral-200 bg-white px-6 py-14 text-center">
            <svg
              aria-hidden="true"
              className="mb-5 h-10 w-10 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5m1.6 8-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m-7 2a2 2 0 1 0 4 0m-8 0a2 2 0 1 0 4 0"
              />
            </svg>
            <h2 className="text-xl font-medium uppercase tracking-wide">Your cart is empty</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
              Looks like you haven&apos;t found your favorites yet. Explore the collection and add something you love.
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex min-h-12 items-center justify-center bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              Continue shopping
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
            <section aria-label="Items in your cart" className="border-y border-neutral-200 bg-white px-4 sm:px-6">
              {cart.map((item) => (
                <article
                  key={getCartLineKey(item)}
                  className="grid grid-cols-[88px_1fr] gap-4 border-b border-neutral-200 py-5 last:border-b-0 sm:grid-cols-[112px_1fr_auto] sm:gap-6 sm:py-6"
                >
                  <div className="relative aspect-square overflow-hidden bg-neutral-100">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 639px) 88px, 112px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col items-start">
                    <h2 className="text-sm font-semibold uppercase tracking-wide sm:text-base">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600">
                      {formatPrice(item.price)}{item.sizeMl ? ` · ${item.sizeMl}ml` : ''}
                    </p>
                    <div className="mt-auto flex items-center gap-4 pt-4">
                      <div className="flex h-9 items-center border border-neutral-300">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.title}${item.sizeMl ? ` ${item.sizeMl}ml` : ''} quantity`}
                          onClick={() => updateQuantity(getCartLineKey(item), -1)}
                          className="h-full w-9 text-lg text-neutral-600 transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset"
                        >
                          −
                        </button>
                        <span aria-live="polite" className="min-w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.title}${item.sizeMl ? ` ${item.sizeMl}ml` : ''} quantity`}
                          onClick={() => updateQuantity(getCartLineKey(item), 1)}
                          className="h-full w-9 text-lg text-neutral-600 transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(getCartLineKey(item))}
                        className="text-xs text-neutral-500 underline underline-offset-4 transition-colors hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="col-start-2 row-start-2 text-right text-sm font-medium sm:col-start-3 sm:row-start-1 sm:pt-1">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </article>
              ))}
            </section>

            <aside className="border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[.14em]">Order summary</h2>
              <div className="mt-6 flex justify-between gap-4 border-b border-neutral-200 pb-4 text-sm">
                <span className="text-neutral-600">Subtotal ({itemCount} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-neutral-500">
                Delivery charges are confirmed at checkout.
              </p>
              <Link
                href="/checkout"
                className="mt-6 flex min-h-12 w-full items-center justify-center bg-neutral-900 px-5 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                Proceed to checkout
              </Link>
              <Link
                href="/"
                className="mt-5 block text-center text-xs font-medium uppercase tracking-[.12em] text-neutral-600 underline underline-offset-4 transition-colors hover:text-[#05AE7A]"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
