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
        Number(item.quantity) < 1,
    )
  ) {
    throw new Error('Saved cart data is not valid.');
  }

  return cart;
}

function formatPrice(price) {
  return `৳${Number(price).toLocaleString('en-BD')}`;
}

const inputClassName =
  'mt-2 min-h-12 w-full border border-neutral-300 bg-white px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-black';

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let active = true;
    window.queueMicrotask(() => {
      if (!active) return;
      try {
        setCart(readCart());
      } catch (cartError) {
        console.error('Could not read the saved cart at checkout.', cartError);
        setError('We could not load your cart. Return to your cart and try again.');
      } finally {
        setIsLoaded(true);
      }
    });

    return () => { active = false; };
  }, []);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  const deliveryFee = deliveryZone === 'inside_dhaka'
    ? 80
    : deliveryZone === 'outside_dhaka'
      ? 120
      : null;

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.get('name') || ''),
          phone: String(formData.get('phone') || ''),
          email: String(formData.get('email') || ''),
          address: String(formData.get('address') || ''),
          city: String(formData.get('city') || ''),
          note: String(formData.get('note') || ''),
          deliveryZone,
          items: cart.map(({ id, quantity }) => ({ id, quantity })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'অর্ডার জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');

      setConfirmation(result.order);
      try {
        window.localStorage.removeItem('dreven-cart');
        window.dispatchEvent(new Event('dreven-cart-updated'));
      } catch (storageError) {
        console.error('The order was placed, but the local cart could not be cleared.', storageError);
      }
      setCart([]);
    } catch (submitError) {
      console.error('Checkout order submission failed.', submitError);
      setNotice(submitError.message || 'অর্ডার জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] px-4 py-10 text-neutral-900 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 border-b border-neutral-200 pb-6 sm:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-neutral-500">
            Almost there
          </p>
          <h1 className="text-3xl font-medium uppercase tracking-wide sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            Review your items and enter your delivery details.
          </p>
        </div>

        {!isLoaded ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="h-96 animate-pulse bg-neutral-100" />
            <div className="h-72 animate-pulse bg-neutral-100" />
          </div>
        ) : confirmation ? (
          <section className="mx-auto max-w-2xl border border-emerald-200 bg-white px-6 py-12 text-center sm:px-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700" aria-hidden="true">
              ✓
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-emerald-700">
              Order received
            </p>
            <h2 className="mt-3 text-2xl font-medium uppercase tracking-wide">
              Thank you for your order
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Your cash-on-delivery order has been saved. Our team will contact you to confirm delivery.
            </p>
            <dl className="mx-auto mt-7 max-w-sm divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-neutral-500">Order number</dt>
                <dd className="font-semibold">{confirmation.id}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-neutral-500">Delivery</dt>
                <dd>{formatPrice(confirmation.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="font-medium">Cash due on delivery</dt>
                <dd className="font-semibold">{formatPrice(confirmation.total)}</dd>
              </div>
            </dl>
            <Link
              href="/"
              className="mt-8 inline-flex min-h-12 items-center justify-center bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A]"
            >
              Continue shopping
            </Link>
          </section>
        ) : error ? (
          <section className="border border-red-200 bg-white px-6 py-10 text-center">
            <p role="alert" className="text-sm text-red-800">{error}</p>
            <Link
              href="/cart"
              className="mt-6 inline-flex min-h-12 items-center justify-center bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A]"
            >
              Return to cart
            </Link>
          </section>
        ) : cart.length === 0 ? (
          <section className="flex min-h-64 flex-col items-center justify-center border border-neutral-200 bg-white px-6 py-12 text-center">
            <h2 className="text-xl font-medium uppercase tracking-wide">Your cart is empty</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Add something to your cart before checking out.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-12 items-center justify-center bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A]"
            >
              Continue shopping
            </Link>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="border border-neutral-200 bg-white p-5 sm:p-7">
                <h2 className="text-sm font-semibold uppercase tracking-[.14em]">
                  Delivery details
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Full name
                    <input required name="name" autoComplete="name" className={inputClassName} />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700">
                    Phone number
                    <input
                      required
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      className={inputClassName}
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    Email address <span className="font-normal text-neutral-400">(optional)</span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      className={inputClassName}
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    Delivery address
                    <textarea
                      required
                      name="address"
                      autoComplete="street-address"
                      rows={3}
                      className={`${inputClassName} resize-y py-3`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    City / district
                    <input
                      required
                      name="city"
                      autoComplete="address-level2"
                      className={inputClassName}
                    />
                  </label>
                  <fieldset className="sm:col-span-2">
                    <legend className="text-sm font-medium text-neutral-700">
                      Delivery area
                    </legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <label className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${deliveryZone === 'inside_dhaka' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                        <input
                          required
                          type="radio"
                          name="deliveryZone"
                          value="inside_dhaka"
                          checked={deliveryZone === 'inside_dhaka'}
                          onChange={(event) => setDeliveryZone(event.target.value)}
                          className="mt-0.5 accent-black"
                        />
                        <span>
                          <span className="block text-sm font-medium">Inside Dhaka</span>
                          <span className="mt-1 block text-xs text-neutral-500">{formatPrice(80)} delivery</span>
                        </span>
                      </label>
                      <label className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${deliveryZone === 'outside_dhaka' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                        <input
                          required
                          type="radio"
                          name="deliveryZone"
                          value="outside_dhaka"
                          checked={deliveryZone === 'outside_dhaka'}
                          onChange={(event) => setDeliveryZone(event.target.value)}
                          className="mt-0.5 accent-black"
                        />
                        <span>
                          <span className="block text-sm font-medium">Outside Dhaka</span>
                          <span className="mt-1 block text-xs text-neutral-500">{formatPrice(120)} delivery</span>
                        </span>
                      </label>
                    </div>
                  </fieldset>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    Order note <span className="font-normal text-neutral-400">(optional)</span>
                    <textarea name="note" rows={2} className={`${inputClassName} resize-y py-3`} />
                  </label>
                </div>
              </section>

              <section className="border border-neutral-200 bg-white p-5 sm:p-7">
                <h2 className="text-sm font-semibold uppercase tracking-[.14em]">
                  Payment method
                </h2>
                <label className="mt-5 flex items-start gap-3 border border-neutral-200 p-4">
                  <input
                    required
                    type="radio"
                    name="payment"
                    value="cash-on-delivery"
                    defaultChecked
                    className="mt-0.5 accent-black"
                  />
                  <span>
                    <span className="block text-sm font-medium">Cash on delivery</span>
                    <span className="mt-1 block text-xs leading-5 text-neutral-500">
                      Pay the courier when your order is delivered.
                    </span>
                  </span>
                </label>
              </section>
            </div>

            <aside className="border border-neutral-200 bg-white p-5 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-sm font-semibold uppercase tracking-[.14em]">
                Order summary ({itemCount})
              </h2>
              <ul className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200">
                {cart.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-neutral-100">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="56px"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium uppercase tracking-wide">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Qty {item.quantity} · {formatPrice(item.price)} each
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-medium">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex justify-between gap-4 text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="text-neutral-600">Delivery</span>
                <span className="text-xs text-neutral-500">
                  {deliveryFee === null ? 'Choose a delivery area' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="mt-5 flex justify-between gap-4 border-t border-neutral-200 pt-4 text-sm font-semibold">
                <span>Total including delivery</span>
                <span>{formatPrice(subtotal + (deliveryFee || 0))}</span>
              </div>

              {notice && (
                <p role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 min-h-12 w-full bg-neutral-900 px-5 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Placing order…' : 'Place COD order'}
              </button>
              <p className="mt-3 text-center text-[11px] leading-5 text-neutral-500">
                Your order and delivery details will be saved so our team can fulfil it.
              </p>
              <Link
                href="/cart"
                className="mt-5 block text-center text-xs font-medium uppercase tracking-[.12em] text-neutral-600 underline underline-offset-4 transition-colors hover:text-[#05AE7A]"
              >
                Return to cart
              </Link>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
