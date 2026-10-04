import Link from 'next/link';
import CustomerAuthForm from '../../components/CustomerAuthForm';

export const metadata = {
  title: 'Log In',
  description: 'Log in to your Dreven customer account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#fafaf8] px-4 py-12 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-md border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[.22em] text-neutral-500">
          Welcome back
        </p>
        <h1 className="mt-3 text-center text-3xl font-medium uppercase tracking-wide text-neutral-900">
          Log in
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-neutral-500">
          Log in to your Dreven account.
        </p>

        <CustomerAuthForm mode="login" />

        <p className="mt-7 border-t border-neutral-200 pt-6 text-center text-sm text-neutral-600">
          New to Dreven?{' '}
          <Link href="/signup" className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-[#05AE7A]">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
