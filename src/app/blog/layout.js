export const metadata = {
  title: {
    default: 'Blog',
    template: '%s | Dreven Blog',
  },
  description:
    'News, stories, and updates from Dreven - Dream Heaven.',
  openGraph: {
    type: 'website',
    siteName: 'Dreven - Dream Heaven',
    title: 'Dreven Blog | Dreven - Dream Heaven',
    description: 'News, stories, and updates from Dreven - Dream Heaven.',
    url: '/blog',
  },
  twitter: {
    card: 'summary',
    title: 'Dreven Blog | Dreven - Dream Heaven',
    description: 'News, stories, and updates from Dreven - Dream Heaven.',
  },
};

export default function BlogLayout({ children }) {
  return children;
}