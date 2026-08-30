import type { Metadata } from "next";
import Link from "next/link";
import { CITIES } from "@/lib/tutor-directory";

export const metadata: Metadata = {
  title: "Find Tutors by City in Pakistan",
  description: "Browse verified online and home tutors by city across Pakistan, including Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, and more.",
  alternates: { canonical: "/locations" },
};

export default function LocationsPage() {
  return (
    <main style={{ background: "#f9fafb", minHeight: "70vh" }}>
      <header style={{ background: "#1a1a2e", padding: "4.5rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "clamp(2rem,4vw,3rem)", marginBottom: "1rem" }}>Find Tutors by City</h1>
        <p style={{ color: "#cbd5e1", maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>Compare verified tutors available online and in person across major Pakistani cities.</p>
      </header>
      <section style={{ maxWidth: 1050, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" }}>
          {Object.entries(CITIES).map(([slug, city]) => (
            <Link key={slug} href={`/tutors/city/${slug}`} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.4rem", color: "#1a1a2e", textDecoration: "none" }}>
              <h2 style={{ fontSize: "1.1rem", marginBottom: ".4rem" }}>Tutors in {city}</h2>
              <span style={{ color: "#2563eb", fontSize: ".875rem", fontWeight: 700 }}>Browse tutors →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
