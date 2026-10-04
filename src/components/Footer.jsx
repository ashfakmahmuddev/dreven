// components/Footer.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* অংশ ১: ব্র্যান্ড তথ্য */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Dreven</h3>
            <p className="text-sm leading-relaxed">
              Our goal is to bring you quality halal clothing and fragrances. Explore authentic Palestinian keffiyehs, jubbas, and attar in our collection.
            </p>
          </div>

          {/* অংশ ২: কুইক লিংক */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Shop</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* অংশ ৩: যোগাযোগ */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: info@islamicshop.com</li>
              <li>Phone: +880 1234 567 890</li>
              <li>Address: Dhaka, Bangladesh</li>
            </ul>
          </div>
        </div>
        
        {/* কপিরাইট অংশ */}
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Dreven. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}