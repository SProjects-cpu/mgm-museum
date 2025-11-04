import Link from 'next/link';

export default function SitemapPage() {
  const links = [
    { title: 'Home', href: '/' },
    { title: 'Exhibitions', href: '/exhibitions' },
    { title: 'Book Visit', href: '/book-visit' },
    { title: 'My Bookings', href: '/my-bookings' },
    { title: 'Cart', href: '/cart' },
    { title: 'About', href: '/about' },
    { title: 'Contact', href: '/contact' },
    { title: 'Terms & Conditions', href: '/terms' },
    { title: 'Privacy Policy', href: '/privacy' },
    { title: 'Login', href: '/login' },
  ];

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Sitemap</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <h2 className="text-xl font-semibold text-primary">{link.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{link.href}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
