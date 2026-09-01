import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import LazyWidgets from "@/components/LazyWidgets";
import { Toaster } from "react-hot-toast";
import { BUSINESS_ADDRESS, LEGAL_OPERATOR, PLATFORM_NAME, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TUTORERA® | Pakistan's Tutoring Marketplace",
    template: "%s | TUTORERA®",
  },
  description: "Pakistan's trusted tutoring marketplace. Find verified tutors for Matric, O-Level, FSc, A-Level, and university subjects. Search, compare, and book tutors online.",
  keywords: [
    "tutors in Pakistan",
    "online tutoring Pakistan",
    "find tutor Islamabad",
    "find tutor Lahore",
    "find tutor Karachi",
    "Matric tutor",
    "O Level tutor",
    "FSc tutor",
    "home tutor Pakistan",
    "TUTORERA",
  ],
  authors: [{ name: "MENTISERA (SMC-Private) Limited" }],
  creator: "MENTISERA",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  publisher: "TUTORERA®",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://tutorera.ac.pk",
    siteName: "TUTORERA®",
    title: "TUTORERA® | Pakistan's Tutoring Marketplace",
    description: "Find verified tutors for every subject and level in Pakistan. Safe, structured, and transparent.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TUTORERA® Pakistan's Tutoring Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TUTORERA® | Pakistan's Tutoring Marketplace",
    description: "Find verified tutors for every subject and level in Pakistan.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = [
    { "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: PLATFORM_NAME, legalName: LEGAL_OPERATOR, url: SITE_URL, logo: `${SITE_URL}/og-image.png`, email: SUPPORT_EMAIL, telephone: SUPPORT_PHONE, address: { "@type": "PostalAddress", streetAddress: "House 387, Street 11, Phase 5-b, Ghauri Town", addressLocality: "Islamabad", addressRegion: "Islamabad Capital Territory", addressCountry: "PK" }, description: BUSINESS_ADDRESS, areaServed: { "@type": "Country", name: "Pakistan" } },
    { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: PLATFORM_NAME, publisher: { "@id": `${SITE_URL}/#organization` }, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/tutors?search={search_term_string}`, "query-input": "required name=search_term_string" } },
  ];
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <LazyWidgets />
          </SocketProvider>
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: 'white',
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'white' },
            },
          }}
        />
      </body>
    </html>
  );
}
