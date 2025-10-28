import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalMain } from "@/components/layout/conditional-main";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { MUSEUM_INFO } from "@/lib/constants";
import { Toaster } from "sonner";
import { RealtimeSyncProvider } from "@/lib/contexts/realtime-sync-context";
import { NotFoundProvider } from "@/lib/contexts/not-found-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${MUSEUM_INFO.name} | Book Your Visit`,
    template: `%s | ${MUSEUM_INFO.shortName}`,
  },
  description:
    "Explore the wonders of science at MGM APJ Abdul Kalam Astrospace Science Centre in Aurangabad. Book tickets for planetarium shows, exhibitions, and interactive experiences. Open 9:30 AM to 5:30 PM (Closed Mondays).",
  keywords: [
    "science museum",
    "planetarium",
    "Aurangabad",
    "MGM",
    "APJ Abdul Kalam",
    "science centre",
    "exhibitions",
    "educational",
    "astronomy",
    "space",
    "ISRO",
    "holography",
    "3D theatre",
  ],
  authors: [{ name: MUSEUM_INFO.name }],
  creator: MUSEUM_INFO.name,
  publisher: MUSEUM_INFO.name,
  metadataBase: new URL(MUSEUM_INFO.website),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: MUSEUM_INFO.website,
    siteName: MUSEUM_INFO.name,
    title: MUSEUM_INFO.name,
    description:
      "Experience interactive science exhibitions, planetarium shows, and hands-on learning at MGM Astrospace Science Centre, Aurangabad.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: MUSEUM_INFO.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: MUSEUM_INFO.name,
    description: "Explore the wonders of science in Aurangabad",
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#3498db" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Script 
          src="https://t.contentsquare.net/uxa/81e2a81131983.js" 
          strategy="beforeInteractive"
          async
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <RealtimeSyncProvider>
          <NotFoundProvider>
            <ConditionalNavbar />
            <ConditionalMain>{children}</ConditionalMain>
            <ConditionalFooter />
            <Toaster position="top-right" richColors />
          </NotFoundProvider>
        </RealtimeSyncProvider>
      </body>
    </html>
  );
}
