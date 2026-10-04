'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerAuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    if (isSignup && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/customer/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.get('name') || ''),
          email: String(formData.get('email') || ''),
          password,
          confirmPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your account request could not be completed.');
      window.dispatchEvent(new CustomEvent('dreven-customer-session-updated', { detail: { user: result.user } }));
      router.push('/account');
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {isSignup && (
        <label className="block text-sm font-medium text-neutral-700">
          Full name
          <input
            required
            name="name"
            autoComplete="name"
            placeholder="Your name"
            className="mt-2 min-h-12 w-full border border-neutral-300 bg-white px-4 text-sm font-normal outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
          />
        </label>
      )}

      <label className="block text-sm font-medium text-neutral-700">
        Email address
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 min-h-12 w-full border border-neutral-300 bg-white px-4 text-sm font-normal outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
        />
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Password
        <input
          required
          name="password"
          type="password"
          minLength={8}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder="At least 8 characters"
          className="mt-2 min-h-12 w-full border border-neutral-300 bg-white px-4 text-sm font-normal outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
        />
      </label>

      {isSignup && (
        <label className="block text-sm font-medium text-neutral-700">
          Confirm password
          <input
            required
            name="confirmPassword"
            type="password"
            minLength={8}
            autoComplete="new-password"
            placeholder="Enter your password again"
            className="mt-2 min-h-12 w-full border border-neutral-300 bg-white px-4 text-sm font-normal outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
          />
        </label>
      )}

      {error && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-12 w-full bg-black px-5 text-xs font-semibold uppercase tracking-[.16em] text-white transition-colors hover:bg-[#05AE7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
      </button>

      <p className="text-center text-xs leading-5 text-neutral-500">
        Your password is securely hashed before it is stored.
      </p>
    </form>
  );
}
