import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import LazyWidgets from "@/components/LazyWidgets";
import { Toaster } from "react-hot-toast";
import { BUSINESS_ADDRESS, LEGAL_OPERATOR, PLATFORM_NAME, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import SkipLink from "@/components/SkipLink";
import LocaleBridge from "@/components/LocaleBridge";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TUTORERA | Student-First Tutoring Marketplace",
    template: "%s | TUTORERA",
  },
  description: "TUTORERA is a Student-First Tutoring Marketplace. Students and parents post a learning requirement and preferred budget, receive eligible tutor offers, compare options, and choose a tutor for online or home tuition where available.",
  keywords: [
    "online tutors worldwide",
    "find verified tutors",
    "student demand tutoring marketplace",
    "home tuition",
    "O Level tutor",
    "A Level tutor",
    "GCSE IGCSE tutors",
    "IB tutors",
    "Matric FSc tutor",
    "private tutors",
    "tutors in UAE",
    "tutors in UK",
    "tutors in USA",
    "tutors in Pakistan",
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
  other: {
    "google-adsense-account": "ca-pub-2559940686225219",
  },
  publisher: "TUTORERA",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    // Must match the real (countries)/[countryCode] route segments
    // (lowercase ISO 3166-1 alpha-2, per LAUNCH_MARKETS) - "/usa" was never
    // a real route (the actual route is "/us"), so that hreflang entry
    // pointed Google at a 404.
    languages: {
      "en-GB": "/gb",
      "en-AE": "/ae",
      "en-SA": "/sa",
      "en-PK": "/pk",
      "en-IN": "/in",
      "en-US": "/us",
      "x-default": "/",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/tutorera-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/tutorera-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tutorera.ac.pk",
    siteName: "TUTORERA",
    title: "TUTORERA | Student-First Tutoring Marketplace",
    description: "Post your tuition requirement and preferred budget, receive offers from eligible tutors, compare options, and choose the right tutor.",
    images: [
      {
        url: "/tutorera-logo-transparent.png",
        width: 1200,
        height: 630,
        alt: "TUTORERA by MENTISERA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TUTORERA | Student-First Tutoring Marketplace",
    description: "Post a requirement, receive tutor offers, compare options, and choose your tutor.",
    images: ["/tutorera-logo-transparent.png"],
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
  themeColor: "#0329B2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: PLATFORM_NAME,
        legalName: LEGAL_OPERATOR,
        url: SITE_URL,
        logo: `${SITE_URL}/tutorera-logo-transparent.png`,
        description: "Student-First Tutoring Marketplace for online and home tuition where available. Students and parents post requirements with preferred budgets; eligible tutors submit offers and families choose.",
        address: {
          "@type": "PostalAddress",
          streetAddress: "House 387, Street 11, Phase 5-b, Ghauri Town",
          addressLocality: "Islamabad",
          addressRegion: "Islamabad Capital Territory",
          postalCode: "44000",
          addressCountry: "PK",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: SUPPORT_PHONE,
            contactType: "customer service",
            email: SUPPORT_EMAIL,
            availableLanguage: ["English"],
          },
        ],
        areaServed: [
          { "@type": "Place", name: "Worldwide" },
          { "@type": "Country", name: "Pakistan" },
          { "@type": "Country", name: "United Arab Emirates" },
          { "@type": "Country", name: "United Kingdom" },
        ],
        sameAs: [
          "https://mentisera.com",
          "https://www.facebook.com/tutorerapk",
          "https://www.instagram.com/tutorera.pk",
          "https://www.linkedin.com/company/tutorera",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: PLATFORM_NAME,
        description: "Student-First Tutoring Marketplace where students and parents post learning requirements, receive eligible tutor offers, compare options, and choose who to learn with.",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/tutors?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#service`,
        serviceType: "Student-First Tutoring Marketplace",
        provider: {
          "@id": `${SITE_URL}/#organization`,
        },
        description: "Students and parents set the initial learning requirement and preferred budget. Eligible tutors can submit offers, then the student or parent compares options and chooses a tutor.",
        areaServed: {
          "@type": "Place",
          name: "Worldwide",
        },
      },
    ],
  };

  return (
     <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-2559940686225219" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TDJ8C953');
          `}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7NF2DR8MG6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7NF2DR8MG6', {
              'cookie_domain': 'tutorera.ac.pk',
              'cookie_expires': 43200,
              'cookie_flags': 'SameSite=None;Secure'
            });
          `}
        </Script>
        {/* Google AdSense */}
        <Script
          id="google-adsense"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2559940686225219"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SkipLink />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TDJ8C953"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AuthProvider>
          <LocaleBridge>
            <SocketProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              <LazyWidgets />
            </SocketProvider>
          </LocaleBridge>
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#021550',
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
