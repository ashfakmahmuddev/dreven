const siteUrl = 'https://dreven.com.bd';

export default function sitemap() {
  return [
    {
      url: siteUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}