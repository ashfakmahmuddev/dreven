import { Inter } from 'next/font/google';
import './globals.css';
// হেডার এবং ফুটার ইম্পোর্ট করুন (পাথ আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী হতে পারে)
import Header from '../components/Header';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ইসলামিক শপ', // টাইটেল পরিবর্তন করতে পারেন
  description: 'সেরা মানের ইসলামিক পোশাক ও আতর',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* Header সবসময় সবার উপরে থাকবে */}
        <Header />
        
        {/* Main Content (আপনার page.js এর ডিজাইনগুলো এখানে রেন্ডার হবে) */}
        <div className="flex-grow">
          {children}
        </div>
        
        {/* Footer সবসময় সবার নিচে থাকবে */}
        <Footer />
      </body>
    </html>
  );
}