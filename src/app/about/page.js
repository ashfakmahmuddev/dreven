export const metadata = {
  title: 'About Us',
  description:
    'Learn about Dreven, also known as Dream Heaven, and our collection of quality halal clothing and fragrances.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Us | Dreven - Dream Heaven',
    description:
      'Learn about Dreven, also known as Dream Heaven, and our collection of quality halal clothing and fragrances.',
    url: '/about',
  },
  twitter: {
    title: 'About Us | Dreven - Dream Heaven',
    description:
      'Learn about Dreven, also known as Dream Heaven, and our collection of quality halal clothing and fragrances.',
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
        About Dreven - Dream Heaven
      </h1>
      <div className="space-y-4 text-lg leading-relaxed text-gray-700">
        <p>
          Dreven, also known as Dream Heaven, is an online store for thoughtfully
          selected Islamic clothing and fragrances. Our collection includes
          Palestinian keffiyehs, jubbas, panjabis, everyday wear, and premium
          attar.
        </p>
        <p>
          We bring together comfortable styles and quality essentials to make it
          easier to find meaningful pieces for everyday life.
        </p>
      </div>
    </main>
  );
}