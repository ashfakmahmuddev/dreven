/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    localPatterns: [
      {
        pathname: '/**', // সমস্ত লোকাল পাথ এলাউ করার জন্য
      },
      {
        pathname: '/**',
        search: '?*', // ক্যোয়ারি স্ট্রিং এলাউ করার জন্য
      },
    ],
  },
};

export default nextConfig;