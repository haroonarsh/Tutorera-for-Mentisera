import Link from "next/link";
import { Calendar, User, ArrowRight, ChevronRight } from "lucide-react";
import { getEditorialArticles, getBlogSidebarData } from "@/lib/editorial-content";
import BlogLayout from "@/components/Blog/BlogLayout";
import BlogSidebar from "@/components/Blog/BlogSidebar";
import AdBanner from "@/components/AdBanner";
import type { Metadata } from "next";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Tutoring Guides & Research",
  description:
    "Evidence-conscious, operationally reviewed guides for students, parents, and tutors covering tutor selection, tutor vs home tuition, rates, safety, and learning strategies.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const [{ articles: blogs, total, pages }, sidebarData] = await Promise.all([
    getEditorialArticles({ page, limit: PAGE_SIZE }),
    getBlogSidebarData(),
  ]);

  return (
    <main style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      <header style={{ background: "linear-gradient(135deg, #021550 0%, #0329B2 100%)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", marginBottom: ".75rem" }}>Tutoring Insights & Guides</h1>
        <p style={{ color: "#cbd5e1", maxWidth: 650, margin: "auto" }}>Evidence-conscious, operationally reviewed guidance for students, parents, and tutors. Location-specific guides are clearly labelled.</p>
      </header>
      <AdBanner slot="7346189519" format="auto" label="Advertisement" style={{ maxWidth: 1100, margin: "0 auto" }} />

      <BlogLayout
        sidebar={<BlogSidebar {...sidebarData} />}
        main={
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#021550", margin: 0 }}>All Guides</h2>
              <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 600 }}>{total} guide{total === 1 ? "" : "s"}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.5rem" }}>
              {blogs.map((blog) => (
                <article key={blog._id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ background: "#EEF5FF", color: "#0329B2", padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>{blog.category}</span>
                  </div>
                  <h2 style={{ color: "#021550", fontSize: "1.15rem", lineHeight: 1.4, marginBottom: 10 }}>
                    <Link href={`/blog/${blog.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{blog.title}</Link>
                  </h2>
                  <p style={{ color: "#64748b", lineHeight: 1.65, flex: 1 }}>{blog.metaDescription}</p>
                  <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 18, paddingTop: 14, color: "#64748b", fontSize: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                    <p style={{ display: "flex", gap: 6, alignItems: "center", margin: 0 }}><User size={13} />{blog.author.name}</p>
                    <p style={{ display: "flex", gap: 6, alignItems: "center", margin: 0 }}>
                      <Calendar size={13} />
                      Updated {new Date(blog.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })} · {blog.readingTime}
                    </p>
                  </div>
                  <Link href={`/blog/${blog.slug}`} style={{ color: "#0329B2", fontWeight: 700, textDecoration: "none", display: "flex", gap: 5, alignItems: "center", marginTop: 15 }}>
                    Read guide <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>

            {pages > 1 && (
              <nav aria-label="Blog pagination" style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={p === 1 ? "/blog" : `/blog?page=${p}`}
                    aria-current={p === page ? "page" : undefined}
                    style={{
                      width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13, textDecoration: "none",
                      background: p === page ? "#021550" : "white",
                      color: p === page ? "white" : "#334155",
                      border: p === page ? "none" : "1px solid #E2E8F0",
                    }}
                  >
                    {p}
                  </Link>
                ))}
                {page < pages && (
                  <Link href={`/blog?page=${page + 1}`} aria-label="Next page" style={{ width: 36, height: 36, borderRadius: 9, background: "white", border: "1px solid #E2E8F0", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronRight size={16} />
                  </Link>
                )}
              </nav>
            )}

            <AdBanner slot="7346189519" format="auto" label="Advertisement" style={{ marginTop: "2rem" }} />
          </>
        }
      />
    </main>
  );
}
