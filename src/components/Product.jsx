// src/components/Product.jsx
import Image from 'next/image';
import Link from 'next/link';

export default function Product({ product }) {
  // যদি কোনো প্রোডাক্ট ডাটা না পাঠানো হয়, তবে কিছু ডিফল্ট ভ্যালু ব্যবহার করবে
  const {
    id = 1,
    title = 'African Organic Wild Honey 500g',
    price = 1100,
    originalPrice = 1300,
    discount = '15% OFF',
    image = 'https://via.placeholder.com/300', // আপনার প্রোডাক্ট ইমেজ ইউআরএল বা পাথ
  } = product || {};

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 relative flex flex-col justify-between group">
      {/* টপ সেকশন: ডিসকাউন্ট ট্যাগ এবং উইশলিস্ট/ফেভারিট আইকন */}
      <div className="flex justify-between items-center mb-2 z-10">
        {discount ? (
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-sm">
            {discount}
          </span>
        ) : (
          <div></div>
        )}
        <button 
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Add to Wishlist"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* প্রোডাক্ট ইমেজ সেকশন */}
      <div className="relative w-full h-48 mb-4 overflow-hidden rounded flex items-center justify-center">
        <Image
          src={image}
          alt={title}
          width={300}
          height={300}
          unoptimized
          className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* প্রোডাক্ট টাইটেল ও প্রাইস সেকশন */}
      <div className="flex-grow">
        <Link href={`/product/${id}`}>
          <h3 className="text-gray-800 text-sm font-medium line-clamp-2 hover:text-emerald-600 transition-colors mb-2">
            {title}
          </h3>
        </Link>
        
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-emerald-700 font-bold text-lg">৳{price}</span>
          {originalPrice && (
            <span className="text-gray-400 text-sm line-through">৳{originalPrice}</span>
          )}
        </div>
      </div>

      {/* অ্যাড টু কার্ট বাটন */}
      <button className="w-full border border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white transition-colors py-2 px-4 rounded font-medium text-sm flex items-center justify-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Add To Cart</span>
      </button>
    </div>
  );
}