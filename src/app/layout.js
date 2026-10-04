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
  metadataBase: new URL('https://dreven.com.bd'),
  title: {
    default: 'Dreven | Islamic Clothing & Attar in Bangladesh',
    template: '%s | Dreven',
  },
  description:
    'Shop Islamic clothing and attar in Bangladesh at Dreven. Explore jubbas, panjabis, Palestinian keffiyehs, caps, and everyday halal wear.',
  applicationName: 'Dreven',
  icons: {
    icon: '/dreven_dv.png', // public/logo.png অথবা আপনার আইকনের ফাইল পাথ
    shortcut: '/dreven_dv.png',
    apple: '/dreven_dv.png', // Apple ডিভাইস বা Safari-এর জন্য
  },
  keywords: [
    'Dreven',
    'Dreven Bangladesh',
    'Islamic clothing Bangladesh',
    'halal clothing Bangladesh',
    'Islamic wear',
    'jubba',
    'panjabi',
    'Palestinian keffiyeh',
    'attar',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    url: '/',
    siteName: 'Dreven',
    title: 'Dreven | Islamic Clothing & Attar in Bangladesh',
    description:
      'Shop Islamic clothing and attar in Bangladesh at Dreven. Explore jubbas, panjabis, Palestinian keffiyehs, caps, and everyday halal wear.',
    images: [
      {
        url: '/logo.png',
        alt: 'Dreven Islamic clothing and attar',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Dreven | Islamic Clothing & Attar in Bangladesh',
    description:
      'Shop Islamic clothing and attar in Bangladesh at Dreven. Explore jubbas, panjabis, Palestinian keffiyehs, caps, and everyday halal wear.',
    images: [
      {
        url: '/logo.png',
        alt: 'Dreven Islamic clothing and attar',
      },
    ],
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://dreven.com.bd/#organization',
  name: 'Dreven',
  url: 'https://dreven.com.bd',
  logo: 'https://dreven.com.bd/logo.png',
  description:
    'Dreven is a Bangladesh-based online store for Islamic clothing, halal wear, and fragrances.',
  brand: {
    '@type': 'Brand',
    name: 'Dreven',
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c'),
          }}
        />
        {/* Header সবসময় সবার উপরে থাকবে */}
        <Header />
        
        {/* Main Content */}
        <div className="grow">
          {children}
        </div>
        
        {/* Footer সবসময় সবার নিচে থাকবে */}
        <Footer />
      </body>
    </html>
  );
}