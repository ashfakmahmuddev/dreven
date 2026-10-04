'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CustomerAccount() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    window.queueMicrotask(async () => {
      try {
        const response = await fetch('/api/customer/session', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Account details could not be loaded.');
        if (active) {
          setUser(result.user);
          setStatus(result.user ? 'signed-in' : 'signed-out');
        }
      } catch (requestError) {
        console.error('Could not load customer account.', requestError);
        if (active) {
          setError(requestError.message || 'Account details could not be loaded.');
          setStatus('error');
        }
      }
    });
    return () => { active = false; };
  }, []);

  async function logout() {
    setError('');
    try {
      const response = await fetch('/api/customer/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not log out.');
      window.dispatchEvent(new CustomEvent('dreven-customer-session-updated', { detail: { user: null } }));
      setUser(null);
      setStatus('signed-out');
    } catch (requestError) {
      console.error('Customer logout failed.', requestError);
      setError(requestError.message || 'Could not log out.');
    }
  }

  return (
    <main className="min-h-[60vh] bg-[#fafaf8] px-4 py-12 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
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
            <p className="text-lg font-medium">{user.name}</p>
            <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
            {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
            <button
              type="button"
              onClick={logout}
              className="mt-8 min-h-12 border border-neutral-300 px-6 text-xs font-semibold uppercase tracking-[.15em] transition-colors hover:border-black"
            >
              Log out
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
