import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.mgmapjscicentre.org';
  
  // Static pages
  const staticPages = [
    '',
    '/exhibitions',
    '/shows',
    '/plan-visit',
    '/about',
    '/gallery',
    '/events',
    '/contact',
    '/dashboard',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Exhibition pages
  const exhibitionSlugs = [
    'full-dome-planetarium',
    'aditya-solar-observatory',
    'outdoor-science-park',
    'astro-gallery-isro',
    '3d-science-theatre',
    'mathematics-lab',
    'basic-physics-lab',
    'holography-theatre',
  ];

  const exhibitions = exhibitionSlugs.map((slug) => ({
    url: `${baseUrl}/exhibitions/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Admin pages (noindex in robots.txt)
  const adminPages = [
    '/admin',
    '/admin/exhibitions',
    '/admin/shows',
    '/admin/bookings',
    '/admin/events',
    '/admin/users',
    '/admin/pricing',
    '/admin/content',
    '/admin/analytics',
    '/admin/settings',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.3,
  }));

  return [...staticPages, ...exhibitions, ...adminPages];
}






