'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  bangladeshDistricts,
  deliveryFeesByZone,
  getDeliveryZoneForDistrict,
} from '../lib/bangladesh-districts';
import { getUpazilasForDistrict } from '../lib/bangladesh-upazilas';

const checkoutDetailsStorageKey = 'dreven-checkout-details';

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

function validateCheckoutDetails(details) {
  if (
    !details ||
    typeof details !== 'object' ||
    ['name', 'phone', 'email', 'address', 'district', 'upazila'].some(
      (field) => typeof details[field] !== 'string',
    ) ||
    !bangladeshDistricts.includes(details.district) ||
    !getUpazilasForDistrict(details.district).includes(details.upazila)
  ) {
    throw new Error('Saved checkout details are not valid.');
  }

  return details;
}

function readSavedCheckoutDetails() {
  const savedDetails = window.localStorage.getItem(checkoutDetailsStorageKey);
  return savedDetails ? validateCheckoutDetails(JSON.parse(savedDetails)) : null;
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
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [savedCheckoutDetails, setSavedCheckoutDetails] = useState(null);
  const [savedDetailsWarning, setSavedDetailsWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let active = true;
    window.queueMicrotask(async () => {
      if (!active) return;
      try {
        setCart(readCart());
      } catch (cartError) {
        console.error('Could not read the saved cart at checkout.', cartError);
        setError('We could not load your cart. Return to your cart and try again.');
      }

      try {
        const details = readSavedCheckoutDetails();
        if (details) {
          setSavedCheckoutDetails(details);
          setDistrict(details.district);
          setUpazila(details.upazila);
        } else {
          const response = await fetch('/api/customer/checkout-details', {
            cache: 'no-store',
          });
          if (response.status === 401) return;
          if (!response.ok) {
            throw new Error('Previous order details are temporarily unavailable.');
          }

          const result = await response.json();
          if (!result.details) return;

          const previousOrderDetails = validateCheckoutDetails(result.details);
          if (!active) return;
          setSavedCheckoutDetails(previousOrderDetails);
          setDistrict(previousOrderDetails.district);
          setUpazila(previousOrderDetails.upazila);
          try {
            window.localStorage.setItem(
              checkoutDetailsStorageKey,
              JSON.stringify(previousOrderDetails),
            );
          } catch (storageError) {
            console.error('Could not cache the customer’s previous checkout details.', storageError);
          }
        }
      } catch (detailsError) {
        console.error('Could not restore saved checkout details.', detailsError);
        if (active) {
          setNotice('Your previous delivery details could not be loaded. Please enter them again.');
        }
      } finally {
        if (active) setIsLoaded(true);
      }
    });

    return () => { active = false; };
  }, []);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  const deliveryZone = getDeliveryZoneForDistrict(district);
  const deliveryLabels = {
    dhaka_district: 'Dhaka district',
    dhaka_division: 'Outside Dhaka district · Dhaka division',
    outside_dhaka_division: 'Outside Dhaka division',
  };
  const deliveryFee = deliveryZone ? deliveryFeesByZone[deliveryZone] : null;

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
          city: district,
          upazila,
          note: String(formData.get('note') || ''),
          deliveryZone,
          items: cart.map(({ id, quantity, sizeMl }) => ({
            id,
            quantity,
            ...(sizeMl ? { sizeMl } : {}),
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'অর্ডার জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');

      setConfirmation(result.order);
      try {
        window.localStorage.setItem(checkoutDetailsStorageKey, JSON.stringify({
          name: String(formData.get('name') || ''),
          phone: String(formData.get('phone') || ''),
          email: String(formData.get('email') || ''),
          address: String(formData.get('address') || ''),
          district,
          upazila,
        }));
      } catch (storageError) {
        console.error('The order was placed, but checkout details could not be saved.', storageError);
        setSavedDetailsWarning('Your order was placed, but your details could not be saved for next time.');
      }
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
            {savedDetailsWarning && (
              <p role="status" className="mt-4 text-sm text-amber-800">
                {savedDetailsWarning}
              </p>
            )}
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
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  {savedCheckoutDetails
                    ? 'Details from your last successful order are filled in. You can edit them before placing this order.'
                    : 'Your details from a successful order will be saved in this browser and, when signed in, linked to your account for faster checkout next time.'}
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Full name
                    <input
                      required
                      name="name"
                      autoComplete="name"
                      defaultValue={savedCheckoutDetails?.name || ''}
                      className={inputClassName}
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700">
                    Phone number
                    <input
                      required
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      defaultValue={savedCheckoutDetails?.phone || ''}
                      className={inputClassName}
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    Email address <span className="font-normal text-neutral-400">(optional)</span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      defaultValue={savedCheckoutDetails?.email || ''}
                      className={inputClassName}
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    Full delivery address
                    <textarea
                      required
                      name="address"
                      autoComplete="street-address"
                      rows={3}
                      placeholder="House or holding no., road/street, village or area, and a nearby landmark"
                      defaultValue={savedCheckoutDetails?.address || ''}
                      className={`${inputClassName} resize-y py-3`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    District
                    <select
                      required
                      name="city"
                      autoComplete="address-level2"
                      value={district}
                      onChange={(event) => {
                        setDistrict(event.target.value);
                        setUpazila('');
                      }}
                      className={`${inputClassName} appearance-auto`}
                    >
                      <option value="">Select your district</option>
                      {bangladeshDistricts.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                    Upazila
                    <select
                      required
                      name="upazila"
                      value={upazila}
                      onChange={(event) => setUpazila(event.target.value)}
                      disabled={!district}
                      className={`${inputClassName} appearance-auto disabled:cursor-not-allowed disabled:bg-neutral-100`}
                    >
                      <option value="">
                        {district ? 'Select your upazila' : 'Select a district first'}
                      </option>
                      {getUpazilasForDistrict(district).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="sm:col-span-2" aria-live="polite">
                    <p className="text-sm font-medium text-neutral-700">Delivery charge</p>
                    <p className="mt-2 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                      {deliveryFee === null
                        ? 'Select your district to see the delivery charge.'
                        : `${deliveryLabels[deliveryZone]} · ${formatPrice(deliveryFee)}`}
                    </p>
                  </div>
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
                        {item.sizeMl ? `${item.sizeMl}ml · ` : ''}
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
                  {deliveryFee === null ? 'Select a district' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="mt-5 flex justify-between gap-4 border-t border-neutral-200 pt-4 text-sm font-semibold">
                <span>Total including delivery</span>
                <span>{deliveryFee === null ? 'Select a district' : formatPrice(subtotal + deliveryFee)}</span>
              </div>

              {notice && (
                <p role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !district || !upazila}
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
