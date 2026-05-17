"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import api from "@/lib/axios";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb', accentLight: '#eff6ff' };

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: { name: string; avatar: string; };
  tags: string[];
  createdAt: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/blogs")
      .then(res => setBlogs(res.data.blogs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Static fallback blogs if DB is empty
  const fallbackBlogs: Blog[] = [
    { _id: "1", title: "How to Find a Trusted Tutor in Pakistan", slug: "how-to-find-a-trusted-tutor-in-pakistan", excerpt: "Feeling overwhelmed finding a tutor in Pakistan? This guide breaks down the process into simple, safe steps—from verification to the first session.", coverImage: "", author: { name: "TUTORERA Team", avatar: "" }, tags: ["parents", "guide"], createdAt: new Date().toISOString() },
    { _id: "2", title: "Online Tutoring vs. Traditional Home Tuition in Pakistan", slug: "online-vs-home-tuition-in-pakistan", excerpt: "Online tuition is exploding in Pakistan, but is it better than traditional home tuition? This guide gives parents a clear comparison.", coverImage: "", author: { name: "TUTORERA Team", avatar: "" }, tags: ["online", "comparison"], createdAt: new Date().toISOString() },
    { _id: "3", title: "What Parents Should Look for Before Hiring a Tutor", slug: "what-to-look-for-before-hiring-a-tutor-pakistan", excerpt: "Don't hire a tutor blindly. This essential checklist covers the 5 critical areas every Pakistani parent must consider.", coverImage: "", author: { name: "TUTORERA Team", avatar: "" }, tags: ["parents", "checklist"], createdAt: new Date().toISOString() },
  ];

  const displayBlogs = blogs.length > 0 ? blogs : fallbackBlogs;

  return (
    <div style={{ backgroundColor: C.gray50, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '0.75rem' }}>
          Insights & Guides
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
          Expert advice for parents, students, and educators in Pakistan.
        </p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ width: '40px', height: '40px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {displayBlogs.map((blog, idx) => (
              <article key={blog._id} style={{ backgroundColor: 'white', borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                {/* Cover */}
                <div style={{ height: '190px', background: idx % 2 === 0 ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : `linear-gradient(135deg, ${C.accent}, #7c3aed)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                  <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '700', textAlign: 'center', lineHeight: '1.5' }}>{blog.title}</h3>
                </div>
                {/* Content */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {blog.tags?.slice(0, 2).map(tag => (
                      <span key={tag} style={{ backgroundColor: C.accentLight, color: C.accent, fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '600', textTransform: 'capitalize' }}>{tag}</span>
                    ))}
                  </div>
                  <h2 style={{ fontSize: '1rem', fontWeight: '700', color: C.primary, marginBottom: '0.6rem', lineHeight: '1.4' }}>{blog.title}</h2>
                  <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem', flex: 1 }}>{blog.excerpt}</p>
                  {/* Meta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <User size={12} />{blog.author?.name || "TUTORERA Team"}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} />{new Date(blog.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <Link href={`/blog/${blog.slug}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: C.accent, fontWeight: '600', fontSize: '0.8rem', textDecoration: 'none' }}>
                      Read <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}