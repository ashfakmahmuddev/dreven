import { Albert_Sans } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

// হেডার এবং ফুটার ইম্পোর্ট করুন
import Header from '../components/Header';
import Footer from '../components/Footer';

// Albert Sans ফন্ট কনফিগার করা হলো
const albertSans = Albert_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-albert-sans',
});

export const metadata = {
  title: 'Dreven',
  description: 'Shop quality halal clothing and fragrances at Dreven.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics (gtag.js) Script */}
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
      <body className={`${albertSans.className} flex flex-col min-h-screen font-sans`}>
        {/* Header সবসময় সবার উপরে থাকবে */}
        <Header />
        
        {/* Main Content */}
        <div className="flex-grow">
          {children}
        </div>
        
        {/* Footer সবসময় সবার নিচে থাকবে */}
        <Footer />
      </body>
    </html>
  );
}