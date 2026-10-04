'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CustomerAccount() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    window.queueMicrotask(async () => {
      try {
        const response = await fetch('/api/customer/session', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Account details could not be loaded.');
        if (!active) return;
        setUser(result.user);
        if (!result.user) {
          setStatus('signed-out');
          setOrdersLoading(false);
          return;
        }
        setStatus('signed-in');

        try {
          const ordersResponse = await fetch('/api/customer/orders', { cache: 'no-store' });
          const ordersResult = await ordersResponse.json();
          if (!ordersResponse.ok) {
            throw new Error(ordersResult.error || 'Your orders could not be loaded.');
          }
          if (active) setOrders(ordersResult.orders);
        } catch (ordersRequestError) {
          console.error('Could not load customer orders.', ordersRequestError);
          if (active) setOrdersError(ordersRequestError.message || 'Your orders could not be loaded.');
        } finally {
          if (active) setOrdersLoading(false);
        }
      } catch (requestError) {
        console.error('Could not load customer account.', requestError);
        if (active) {
          setError(requestError.message || 'Account details could not be loaded.');
          setStatus('error');
          setOrdersLoading(false);
        }
      }
    });
    return () => { active = false; };
  }, []);

  async function logout() {
    setError('');
    setLoggingOut(true);
    try {
      const response = await fetch('/api/customer/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not log out.');
      window.dispatchEvent(new CustomEvent('dreven-customer-session-updated', { detail: { user: null } }));
      setUser(null);
      setOrders([]);
      setOrdersError('');
      setStatus('signed-out');
    } catch (requestError) {
      console.error('Customer logout failed.', requestError);
      setError(requestError.message || 'Could not log out.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-[60vh] bg-[#fafaf8] px-4 py-12 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-4xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-neutral-500">
          Dreven customer account
        </p>
        <h1 className="mt-3 text-3xl font-medium uppercase tracking-wide text-neutral-900">
          My account
        </h1>

        {status === 'loading' && (
          <p className="mt-6 text-sm text-neutral-500">Loading your account…</p>
        )}

        {status === 'signed-in' && user && (
          <div className="mt-7">
            <p className="text-lg font-semibold text-neutral-900">{user.name}</p>
            <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
            {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
            <section className="mt-10 border-t border-neutral-200 pt-8" aria-labelledby="account-orders-heading">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="account-orders-heading" className="text-xl font-medium uppercase tracking-wide text-neutral-900">
                    My orders
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    Track your order from packing to delivery.
                  </p>
                </div>
                <span className="text-xs text-neutral-500">
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>

              {ordersLoading ? (
                <p className="mt-6 text-sm text-neutral-500">Loading your orders…</p>
              ) : ordersError ? (
                <p role="alert" className="mt-6 text-sm text-red-700">{ordersError}</p>
              ) : orders.length === 0 ? (
                <div className="mt-6 border border-dashed border-neutral-300 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-neutral-800">No orders yet</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Orders placed while you are signed in will appear here.
                  </p>
                  <Link
                    href="/"
                    className="mt-5 inline-flex min-h-11 items-center justify-center bg-black px-6 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A]"
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {orders.map((order) => (
                    <CustomerOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="mt-8 inline-flex min-h-12 items-center justify-center bg-black px-7 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60"
            >
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        )}

        {status === 'signed-out' && (
          <div className="mt-6">
            <p className="text-sm text-neutral-600">You are not logged in.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-12 items-center justify-center bg-black px-7 text-xs font-semibold uppercase tracking-[.15em] text-white transition-colors hover:bg-[#05AE7A]"
            >
              Log in
            </Link>
          </div>
        )}

        {status === 'error' && (
          <p role="alert" className="mt-6 text-sm text-red-700">{error}</p>
        )}
      </section>
    </main>
  );
}

const orderProgress = [
  { status: 'Pending', label: 'Received' },
  { status: 'Processing', label: 'Packing' },
  { status: 'Shipped', label: 'On the way' },
  { status: 'Delivered', label: 'Delivered' },
];

const orderStatusCopy = {
  Pending: 'We have received your order.',
  Processing: 'Your items are being packed.',
  Shipped: 'Your order is on the way.',
  Delivered: 'Your order has been delivered.',
  Cancelled: 'This order has been cancelled.',
};

function formatPrice(price) {
  return `৳${Number(price).toLocaleString('en-BD')}`;
}

function CustomerOrderCard({ order }) {
  const currentStep = orderProgress.findIndex((step) => step.status === order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <article className="border border-neutral-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-neutral-500">
            Order {order.id}
          </p>
          <p className="mt-2 text-xs text-neutral-500">Placed {order.date}</p>
        </div>
        <span className={`inline-flex items-center border px-3 py-1.5 text-xs font-semibold ${
          isCancelled
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-neutral-300 bg-neutral-50 text-neutral-800'
        }`}>
          {order.status}
        </span>
      </div>

      {isCancelled ? (
        <p className="mt-5 border-l-2 border-red-400 pl-3 text-sm text-neutral-600">
          {orderStatusCopy.Cancelled}
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm text-neutral-600">{orderStatusCopy[order.status]}</p>
          <ol
            aria-label="Order progress"
            className="mt-5 grid grid-cols-4"
          >
            {orderProgress.map((step, index) => {
              const complete = currentStep >= index;
              return (
                <li key={step.status} className="relative text-center">
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={`absolute right-1/2 top-2.5 h-0.5 w-full ${
                        currentStep >= index ? 'bg-neutral-900' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                  <span className={`relative mx-auto flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                    complete
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-transparent'
                  }`}>
                    {complete ? '✓' : ''}
                  </span>
                  <span className={`mt-2 block text-[10px] leading-4 sm:text-xs ${
                    complete ? 'font-medium text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <div className="mt-6 grid gap-5 border-t border-neutral-200 pt-5 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-neutral-500">
            Items ({order.itemCount})
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-neutral-700">
            {order.items.map((item) => (
              <li key={`${item.id}:${item.sizeMl || 'standard'}`}>
                {item.name}{item.sizeMl && <span className="text-neutral-500"> · {item.sizeMl}ml</span>}
                <span className="text-neutral-500"> × {item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Deliver to: {[order.address, order.upazila, order.city].filter(Boolean).join(', ')}
          </p>
        </div>
        <dl className="min-w-36 space-y-2 text-sm sm:text-right">
          <div className="flex justify-between gap-4 text-neutral-500 sm:justify-end">
            <dt>Delivery</dt>
            <dd>{formatPrice(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between gap-4 font-semibold text-neutral-900 sm:justify-end">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
          <p className="text-xs text-neutral-500">{order.paymentMethod}</p>
        </dl>
      </div>
    </article>
  );
}
