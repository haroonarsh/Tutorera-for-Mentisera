import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { getEditorialArticles } from "@/lib/editorial-content";
import AdBanner from "@/components/AdBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutoring Guides & Research | TUTORERA Blog",
  description:
    "Evidence-conscious, operationally reviewed guides for students, parents, and tutors covering tutor selection, tutor vs home tuition, rates, safety, and learning strategies.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const blogs = await getEditorialArticles();
  return <main style={{ background: "#F5F7FF", minHeight: "100vh" }}>
    <header style={{ background: "#021550", padding: "4rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", marginBottom: ".75rem" }}>Tutoring Insights & Guides</h1>
      <p style={{ color: "#cbd5e1", maxWidth: 650, margin: "auto" }}>Evidence-conscious, operationally reviewed guidance for students, parents, and tutors. Location-specific guides are clearly labelled.</p>
    </header>
    <AdBanner slot="7346189519" format="auto" label="Advertisement" style={{ maxWidth: 1100, margin: "0 auto" }} />
    <section style={{ maxWidth: 1100, margin: "auto", padding: "3rem 1.5rem" }} aria-label="Published guides">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.75rem" }}>
        {blogs.map(blog => <article key={blog._id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>{blog.tags.slice(0, 3).map(tag => <span key={tag} style={{ background: "#EEF5FF", color: "#0329B2", padding: "3px 8px", borderRadius: 20, fontSize: 12 }}>{tag}</span>)}</div>
          <h2 style={{ color: "#021550", fontSize: "1.15rem", lineHeight: 1.4, marginBottom: 10 }}><Link href={`/blog/${blog.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{blog.title}</Link></h2>
          <p style={{ color: "#64748b", lineHeight: 1.65, flex: 1 }}>{blog.excerpt}</p>
          <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 18, paddingTop: 14, color: "#64748b", fontSize: 12 }}>
            <p style={{ display: "flex", gap: 6, alignItems: "center" }}><User size={13}/>{blog.author.name}</p>
            <p style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 5 }}><Calendar size={13}/>Updated {new Date(blog.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</p>
          </div>
          <Link href={`/blog/${blog.slug}`} style={{ color: "#0329B2", fontWeight: 700, textDecoration: "none", display: "flex", gap: 5, alignItems: "center", marginTop: 15 }}>Read guide <ArrowRight size={15}/></Link>
        </article>)}
      </div>
      <AdBanner slot="7346189519" format="auto" label="Advertisement" style={{ maxWidth: 1100, margin: "2rem auto 0" }} />
    </section>
  </main>;
}
