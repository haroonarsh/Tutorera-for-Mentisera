import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import ConditionalLayout from "@/components/ConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TUTORERA® | Pakistan's Tutoring Marketplace",
  description: "Find trusted verified tutors in Pakistan.",
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
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}