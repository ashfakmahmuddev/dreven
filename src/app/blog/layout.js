export const metadata = {
  title: {
    default: 'Blog',
    template: '%s | Dreven Blog',
  },
  description:
    'News, stories, and updates from Dreven on Islamic clothing, halal fashion, attar, and everyday wear.',
  openGraph: {
    type: 'website',
    siteName: 'Dreven',
    title: 'Dreven Blog',
    description:
      'News, stories, and updates from Dreven on Islamic clothing, halal fashion, attar, and everyday wear.',
    url: '/blog',
  },
  twitter: {
    card: 'summary',
    title: 'Dreven Blog',
    description:
      'News, stories, and updates from Dreven on Islamic clothing, halal fashion, attar, and everyday wear.',
  },
};

export default function BlogLayout({ children }) {
  return children;
}