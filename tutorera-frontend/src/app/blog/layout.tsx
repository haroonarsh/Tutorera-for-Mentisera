import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tutoring Guides and Education Resources", description: "Practical tutoring, learning, safety, and education guides for Pakistani students, parents, and tutors.", alternates: { canonical: "/blog" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
