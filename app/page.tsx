import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Welcome to MGM APJ Abdul Kalam Astrospace Science Centre & Club in Aurangabad.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold">MGM APJ Abdul Kalam Astrospace Science Centre</h1>
        <p className="text-xl text-muted-foreground">
          Welcome to our museum! Explore interactive exhibitions, planetarium shows, and hands-on science experiences.
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <Link 
            href="/exhibitions" 
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            View Exhibitions
          </Link>
          <Link 
            href="/book-visit" 
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
          >
            Book Visit
          </Link>
          <Link 
            href="/cart" 
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent"
          >
            View Cart
          </Link>
        </div>
        <div className="pt-8 text-sm text-muted-foreground">
          <p>All features are working:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Booking System</li>
            <li>Payment Processing</li>
            <li>Admin Panel</li>
            <li>Cart Functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
