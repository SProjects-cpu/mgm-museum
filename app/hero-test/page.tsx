// app/hero-test/page.tsx - Demo page for testing the scroll-based navigation
import { AnimatedNavFramer } from "@/components/ui/navigation-menu";

export default function HeroTestPage() {
  return (
    <>
      <AnimatedNavFramer />
      <main className="container mx-auto px-4">
        <div className="h-screen pt-8">
          <h1 className="text-4xl font-bold text-center">
            Scroll-Based Navigation
          </h1>
          <p className="text-center text-muted-foreground mt-4">
            Scroll down to see the navigation disappear completely. Scroll up to bring it back.
          </p>
          <div className="mt-8 text-center">
            <p className="text-lg text-muted-foreground">
              The navigation will hide when scrolling down and reappear when scrolling up.
            </p>
          </div>
        </div>
        <div className="h-[300vh] bg-gradient-to-b from-muted to-background rounded-lg p-8">
          <h2 className="text-2xl font-bold">Scroll Test Content</h2>
          <p className="mt-4">
            This page has extra height to test the scroll behavior. The navigation will:
          </p>
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold">Scroll Behavior:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Hide:</strong> When scrolling down after 100px</li>
              <li><strong>Show:</strong> When scrolling up at any point</li>
              <li><strong>Always visible:</strong> When near the top of the page</li>
              <li><strong>Smooth transitions:</strong> Spring-based animations</li>
            </ul>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="bg-card p-6 rounded-lg shadow-sm border">
                <h4 className="font-semibold mb-2">Content Block {i + 1}</h4>
                <p className="text-muted-foreground">
                  This is additional content to create scrollable height for testing the navigation behavior.
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}