import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "In-Person / Home Tuition Terms",
  description: "TUTORERA terms for home tuition, police verification, safeguarding, tutor conduct, and incident reporting.",
  alternates: { canonical: "/in-person-home-tuition-terms" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
