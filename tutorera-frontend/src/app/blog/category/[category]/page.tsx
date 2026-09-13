import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, ChevronRight, User } from "lucide-react";
import { getEditorialArticles, getEditorialCategories, getBlogSidebarData, categoryToSlug } from "@/lib/editorial-content";
import BlogLayout from "@/components/Blog/BlogLayout";
import BlogSidebar from "@/components/Blog/BlogSidebar";
import AdBanner from "@/components/AdBanner";
import type { Metadata } from "next";

const PAGE_SIZE = 12;

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ page?: string }> };

async function resolveCategory(slug: string): Promise<string | null> {
  const categories = await getEditorialCategories();
  return categories.find((c) => categoryToSlug(c.category) === slug)?.category || null;
}

export async function generateStaticParams() {
  const categories = await getEditorialCategories();
  return categories.map((c) => ({ category: categoryToSlug(c.category) }));
}

export async function generateMetadata({ params }: Omit<Props, "searchParams">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) return {};
  const path = `/blog/category/${slug}`;
  return {
    title: `${category} — Tutoring Guides`,
    description: `TUTORERA guides and research filed under ${category}.`,
    alternates: { canonical: path },
  };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const category = await resolveCategory(slug);
  if (!category) notFound();

  const [{ articles: blogs, total, pages }, sidebarData] = await Promise.all([
    getEditorialArticles({ category, page, limit: PAGE_SIZE }),
    getBlogSidebarData(),
  ]);

  return (
    <main style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      <header style={{ background: "linear-gradient(135deg, #021550 0%, #0329B2 100%)", padding: "3.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <nav aria-label="Breadcrumb" style={{ color: "#94A3B8", fontSize: 13, marginBottom: 14 }}>
            <Link href="/blog" style={{ color: "#CBD5E1" }}>Blog</Link> <span style={{ margin: "0 6px" }}>/</span> <span style={{ color: "white" }}>{category}</span>
          </nav>
          <h1 style={{ color: "white", fontSize: "2.15rem", fontWeight: 800, margin: "0 0 10px" }}>{category}</h1>
          <p style={{ color: "#CBD5E1", fontSize: "0.95rem", margin: 0 }}>{total} guide{total === 1 ? "" : "s"} filed under {category}.</p>
        </div>
      </header>

      <BlogLayout
        sidebar={<BlogSidebar {...sidebarData} activeCategory={category} />}
        main={
          <>
            {blogs.length === 0 ? (
              <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "3rem", textAlign: "center" }}>
                <p style={{ color: "#64748B" }}>No guides published in this category yet.</p>
                <Link href="/blog" style={{ color: "#0329B2", fontWeight: 700 }}>Browse all guides →</Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.5rem" }}>
                {blogs.map((blog) => (
                  <article key={blog._id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
                    <h2 style={{ color: "#021550", fontSize: "1.1rem", lineHeight: 1.4, marginBottom: 10 }}>
                      <Link href={`/blog/${blog.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{blog.title}</Link>
                    </h2>
                    <p style={{ color: "#64748b", lineHeight: 1.65, flex: 1 }}>{blog.metaDescription}</p>
                    <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 18, paddingTop: 14, color: "#64748b", fontSize: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                      <p style={{ display: "flex", gap: 6, alignItems: "center", margin: 0 }}><User size={13} />{blog.author.name}</p>
                      <p style={{ display: "flex", gap: 6, alignItems: "center", margin: 0 }}><Calendar size={13} />Updated {new Date(blog.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })} · {blog.readingTime}</p>
                    </div>
                    <Link href={`/blog/${blog.slug}`} style={{ color: "#0329B2", fontWeight: 700, textDecoration: "none", display: "flex", gap: 5, alignItems: "center", marginTop: 15 }}>
                      Read guide <ArrowRight size={15} />
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {pages > 1 && (
              <nav aria-label="Category pagination" style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={p === 1 ? `/blog/category/${slug}` : `/blog/category/${slug}?page=${p}`}
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
                  <Link href={`/blog/category/${slug}?page=${page + 1}`} aria-label="Next page" style={{ width: 36, height: 36, borderRadius: 9, background: "white", border: "1px solid #E2E8F0", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
