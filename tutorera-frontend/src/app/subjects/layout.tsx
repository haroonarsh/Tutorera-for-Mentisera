import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tutors by Subject", description: "Browse verified tutors for Mathematics, Sciences, Languages, Commerce, test preparation, and technology subjects in Pakistan.", alternates: { canonical: "/subjects" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
