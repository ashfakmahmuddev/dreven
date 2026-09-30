// components/Footer.jsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* অংশ ১: ব্র্যান্ড তথ্য */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">ইসলামিক শপ</h3>
            <p className="text-sm leading-relaxed">
              আপনাকে সেরা মানের হালাল পোশাক এবং সুগন্ধি পৌঁছে দেওয়াই আমাদের লক্ষ্য। আমাদের কালেকশনে আছে অরিজিনাল ফিলিস্তিনি ক্যাফিয়া, জুব্বা এবং আতর।
            </p>
          </div>

          {/* অংশ ২: কুইক লিংক */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">প্রয়োজনীয় লিংক</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-emerald-400 transition-colors">হোম</Link></li>
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">শপ</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">যোগাযোগ</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">প্রাইভেসি পলিসি</Link></li>
            </ul>
          </div>

          {/* অংশ ৩: যোগাযোগ */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">যোগাযোগ করুন</h4>
            <ul className="space-y-2 text-sm">
              <li>ইমেইল: info@islamicshop.com</li>
              <li>ফোন: +880 1234 567 890</li>
              <li>ঠিকানা: ঢাকা, বাংলাদেশ</li>
            </ul>
          </div>
        </div>
        
        {/* কপিরাইট অংশ */}
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} ইসলামিক শপ। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  );
}