// components/Header.jsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* লোগো অংশ */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-emerald-800">
              ইসলামিক শপ
            </Link>
          </div>

          {/* মেনু আইটেম (ডেস্কটপের জন্য) */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-emerald-600 transition-colors">হোম</Link>
            <Link href="#categories" className="text-gray-700 hover:text-emerald-600 transition-colors">ক্যাটাগরি</Link>
            <Link href="#products" className="text-gray-700 hover:text-emerald-600 transition-colors">প্রোডাক্টস</Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 transition-colors">আমাদের সম্পর্কে</Link>
          </nav>

          {/* আইকন বা বাটন (সার্চ, কার্ট) */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-emerald-600">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            </button>
            <button className="text-gray-500 hover:text-emerald-600 relative">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
               {/* কার্ট আইটেম কাউন্টার */}
               <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">0</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}