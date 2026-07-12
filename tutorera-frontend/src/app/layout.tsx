import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieBanner from "@/components/CookieBanner";
import AIChatWidget from "@/components/AIChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TUTORERA® | Pakistan's Tutoring Marketplace",
    template: "%s | TUTORERA®",
  },
  verification: {
       google: "your-verification-code-here",
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
  publisher: "TUTORERA®",
  metadataBase: new URL("https://tutorera-frontend.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://tutorera-frontend.vercel.app",
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#1a1a2e",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <WhatsAppButton />
            <AIChatWidget />
            <CookieBanner />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}