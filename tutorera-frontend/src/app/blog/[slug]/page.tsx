import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, ShieldCheck, User } from "lucide-react";
import { getEditorialArticle, getEditorialArticles, getBlogSidebarData, categoryToSlug, STATIC_ARTICLES } from "@/lib/editorial-content";
import { renderBlogContent } from "@/lib/blog-markdown";
import AdBanner from "@/components/AdBanner";
import BlogLayout from "@/components/Blog/BlogLayout";
import BlogSidebar from "@/components/Blog/BlogSidebar";
import PostRequirementCTA from "@/components/marketplace/PostRequirementCTA";
import styles from "./BlogArticle.module.css";

export function generateStaticParams() { return STATIC_ARTICLES.map(({ slug }) => ({ slug })); }

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [blog, sidebarData] = await Promise.all([getEditorialArticle(slug), getBlogSidebarData()]);
  if (!blog) notFound();

  // Related posts: same category, falling back to most recent when fewer
  // than 3 exist in-category (excluding the current post either way).
  const sameCategory = await getEditorialArticles({ category: blog.category, limit: 6 });
  let related = sameCategory.articles.filter((a) => a.slug !== blog.slug).slice(0, 3);
  if (related.length < 3) {
    const recent = await getEditorialArticles({ limit: 10 });
    const extra = recent.articles.filter((a) => a.slug !== blog.slug && !related.some((r) => r.slug === a.slug));
    related = [...related, ...extra].slice(0, 3);
  }

  const html = renderBlogContent(blog.content);
  const updatedLabel = new Date(blog.updatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <main style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      <header style={{ background: "linear-gradient(135deg, #021550 0%, #0329B2 100%)", padding: "3rem 1.5rem 2.5rem" }}>
        <div style={{ maxWidth: 800, margin: "auto" }}>
          <nav aria-label="Breadcrumb" style={{ color: "#94A3B8", fontSize: 13, marginBottom: 18 }}>
            <Link href="/" style={{ color: "#CBD5E1" }}>Home</Link> <span style={{ margin: "0 6px" }}>/</span>
            <Link href="/blog" style={{ color: "#CBD5E1" }}>Blog</Link> <span style={{ margin: "0 6px" }}>/</span>
            <Link href={`/blog/category/${categoryToSlug(blog.category)}`} style={{ color: "#CBD5E1" }}>{blog.category}</Link>
          </nav>
          <Link href="/blog" style={{ color: "#cbd5e1", textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center", marginBottom: 16 }}>
            <ArrowLeft size={16} />All guides
          </Link>
          <h1 style={{ color: "white", fontSize: "clamp(1.8rem,4vw,2.7rem)", lineHeight: 1.25, margin: "0 0 1rem" }}>{blog.title}</h1>
          <div style={{ color: "#cbd5e1", display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><User size={14} />{blog.author.name}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Clock size={14} />{blog.readingTime}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Calendar size={14} />Updated {updatedLabel}</span>
          </div>
        </div>
      </header>
      <AdBanner slot="7346189519" format="auto" label="Advertisement" style={{ maxWidth: 800, margin: "0 auto" }} />

      <BlogLayout
        sidebar={<BlogSidebar {...sidebarData} activeCategory={blog.category} />}
        main={
          <div style={{ maxWidth: 800 }}>
            {/* Visible (not collapsed) author byline block */}
            <aside style={{ background: "#EEF5FF", border: "1px solid #bfdbfe", padding: "1rem 1.25rem", borderRadius: 10, color: "#1e3a8a", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>Written by <Link href={blog.author.url}>{blog.author.name}</Link></p>
                <p style={{ margin: "0.3rem 0 0", lineHeight: 1.6 }}>Reviewed for platform-process accuracy by <Link href={blog.reviewer.url}>{blog.reviewer.name}</Link>. General educational guidance; academic outcomes are not guaranteed.</p>
                <p style={{ margin: "0.4rem 0 0", fontWeight: 700, fontSize: "0.85rem" }}>Last updated {updatedLabel}</p>
              </div>
            </aside>

            <article className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />

            <div style={{ marginTop: 28 }}>
              <PostRequirementCTA />
            </div>

            {related.length > 0 && (
              <section style={{ marginTop: 44 }} aria-label="Related guides">
                <h2 style={{ color: "#021550", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 18px" }}>Related Guides</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                  {related.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, textDecoration: "none" }}>
                      <span style={{ background: "#EEF5FF", color: "#0329B2", padding: "3px 8px", borderRadius: 999, fontSize: "0.66rem", fontWeight: 700 }}>{post.category}</span>
                      <p style={{ color: "#021550", fontSize: "0.85rem", fontWeight: 700, margin: "10px 0 0", lineHeight: 1.4 }}>{post.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <AdBanner slot="7346189519" format="auto" label="Advertisement" style={{ marginTop: "2rem" }} />
          </div>
        }
      />
    </main>
  );
}
