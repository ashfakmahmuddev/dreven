export const metadata = {
  title: 'About Us',
  description:
    'Learn about Dreven, a Bangladesh-based online store for Islamic clothing, halal wear, and fragrances.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Us | Dreven',
    description:
      'Learn about Dreven, a Bangladesh-based online store for Islamic clothing, halal wear, and fragrances.',
    url: '/about',
  },
  twitter: {
    title: 'About Us | Dreven',
    description:
      'Learn about Dreven, a Bangladesh-based online store for Islamic clothing, halal wear, and fragrances.',
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
        About Dreven
      </h1>
      <div className="space-y-4 text-lg leading-relaxed text-gray-700">
        <p>
          Dreven is a Bangladesh-based online store for thoughtfully selected
          Islamic clothing and fragrances. Our collection includes Palestinian
          keffiyehs, jubbas, panjabis, everyday wear, and premium attar.
        </p>
        <p>
          We bring together comfortable styles and quality essentials to make it
          easier to find meaningful pieces for everyday life.
        </p>
      </div>
    </main>
  );
}