import Link from 'next/link';
import CustomerAuthForm from '../../components/CustomerAuthForm';

export const metadata = {
  title: 'Sign Up',
  description: 'Create your Dreven customer account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#fafaf8] px-4 py-12 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-md border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[.22em] text-neutral-500">
          Welcome to Dreven
        </p>
        <h1 className="mt-3 text-center text-3xl font-medium uppercase tracking-wide text-neutral-900">
          Create an account
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-neutral-500">
          Sign up to make your next visit easier.
        </p>

        <CustomerAuthForm mode="signup" />

        <p className="mt-7 border-t border-neutral-200 pt-6 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-[#05AE7A]">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
