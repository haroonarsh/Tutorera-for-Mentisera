import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tutors by Subject", description: "Browse verified tutors for mathematics, sciences, languages, commerce, test preparation, and technology subjects worldwide.", alternates: { canonical: "/subjects" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
