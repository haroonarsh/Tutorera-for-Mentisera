import type { Metadata } from "next";
export const metadata: Metadata = { title: "Platform Disclaimer", description: "Important information about TUTORERA's role as a marketplace connecting students and independent tutors.", alternates: { canonical: "/disclaimer" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
