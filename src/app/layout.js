import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script'; // 1. Script ইম্পোর্ট করা হয়েছে

// হেডার এবং ফুটার ইম্পোর্ট করুন
import Header from '../components/Header';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ইসলামিক শপ',
  description: 'সেরা মানের ইসলামিক পোশাক ও আতর',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        {/* 2. Google Analytics (gtag.js) Script */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5SCDZRN2EE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-5SCDZRN2EE');
          `}
        </Script>
      </head>
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