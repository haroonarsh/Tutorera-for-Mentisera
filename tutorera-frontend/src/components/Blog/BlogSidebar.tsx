"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { EditorialArticle, EditorialCategory } from "@/lib/editorial-content";
import { categoryToSlug } from "@/lib/editorial-content";
import PostRequirementCTA from "@/components/marketplace/PostRequirementCTA";

const COUNTRIES = [
  { label: "Pakistan", flag: "🇵🇰", href: "/pk/tutors" },
  { label: "USA", flag: "🇺🇸", href: "/us/tutors" },
  { label: "India", flag: "🇮🇳", href: "/in/tutors" },
  { label: "Saudi Arabia", flag: "🇸🇦", href: "/sa/tutors" },
  { label: "UAE", flag: "🇦🇪", href: "/ae/tutors" },
  { label: "UK", flag: "🇬🇧", href: "/gb/tutors" },
];

const NEWSLETTER_ENABLED = process.env.NEXT_PUBLIC_BLOG_NEWSLETTER_ENABLED === "true";

export interface BlogSidebarProps {
  categories: EditorialCategory[];
  activeCategory?: string;
  featuredPosts: EditorialArticle[];
  recentPosts: EditorialArticle[];
  /** Lightweight fields only - just enough for the client-side title/excerpt filter. */
  searchIndex: { slug: string; title: string; excerpt: string }[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function BlogSidebar({ categories, activeCategory, featuredPosts, recentPosts, searchIndex }: BlogSidebarProps) {
  const [query, setQuery] = useState("");

  // Client-side filter over title + excerpt only - fine at the current post
  // count. TODO: replace with a real search backend (e.g. a dedicated search
  // endpoint or an indexed service) once the blog has enough posts that
  // shipping the full searchIndex to the client stops being reasonable.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter((post) => post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)).slice(0, 6);
  }, [query, searchIndex]);

  const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20 };
  const eyebrowStyle: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748B", margin: "0 0 12px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 320, flexShrink: 0 }}>

      {/* 1. Search */}
      <div style={cardStyle}>
        <label htmlFor="blog-sidebar-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
          Search articles
        </label>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            id="blog-sidebar-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides..."
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px 11px 36px", border: "1.5px solid #E2E8F0", borderRadius: 9, fontSize: "0.85rem", fontFamily: "inherit", color: "#021550" }}
          />
        </div>
        {results.length > 0 && (
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {results.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} style={{ display: "block", padding: "8px 10px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, color: "#021550" }}>
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <p style={{ fontSize: "0.78rem", color: "#94A3B8", margin: "10px 0 0" }}>No guides match &ldquo;{query}&rdquo;.</p>
        )}
      </div>

      {/* 2. Categories */}
      <div style={cardStyle}>
        <p style={eyebrowStyle}>Categories</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {categories.map((cat) => {
            const isActive = cat.category === activeCategory;
            return (
              <Link
                key={cat.category}
                href={`/blog/category/${categoryToSlug(cat.category)}`}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: 8,
                  fontSize: "0.84rem", fontWeight: 600, textDecoration: "none",
                  background: isActive ? "#EEF5FF" : "transparent",
                  color: isActive ? "#0329B2" : "#334155",
                }}
              >
                {cat.category}
                <span style={{ color: isActive ? "#0329B2" : "#94A3B8", fontSize: "0.75rem", fontWeight: 700 }}>{cat.count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Popular / Featured */}
      {featuredPosts.length > 0 && (
        <div style={cardStyle}>
          <p style={eyebrowStyle}>Popular Guides</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {featuredPosts.map((post, index) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ display: "flex", gap: 10, alignItems: "flex-start", textDecoration: "none" }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: "#021550", color: "white", fontSize: "0.68rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {index + 1}
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#021550", lineHeight: 1.4 }}>{post.title}</span>
              </Link>
            ))}
          </div>
          {/* TODO: switch to real analytics-driven popularity ranking once view
              tracking exists on posts - this list is featured-flagged posts,
              falling back to most recent. Never fabricate view counts in the UI. */}
        </div>
      )}

      {/* 4. Post a Requirement CTA */}
      <PostRequirementCTA variant="card" />

      {/* 5. Find Tutors by Country */}
      <div style={cardStyle}>
        <p style={eyebrowStyle}>Find Tutors by Country</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {COUNTRIES.map((country) => (
            <Link key={country.href} href={country.href} style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", padding: "8px 10px", borderRadius: 8, background: "#F8FAFF", textDecoration: "none" }}>
              {country.flag} {country.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 6. Newsletter - gated behind env flag since the email provider isn't decided yet */}
      <div style={{ ...cardStyle, opacity: NEWSLETTER_ENABLED ? 1 : 0.6 }}>
        <p style={{ ...eyebrowStyle, marginBottom: 6 }}>Newsletter</p>
        <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0 0 12px", lineHeight: 1.5 }}>Monthly tutoring tips, straight to your inbox.</p>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <label htmlFor="blog-newsletter-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            Email address
          </label>
          <input
            id="blog-newsletter-email"
            type="email"
            disabled={!NEWSLETTER_ENABLED}
            placeholder="you@example.com"
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: "0.8rem", fontFamily: "inherit", background: NEWSLETTER_ENABLED ? "white" : "#F8FAFC", color: NEWSLETTER_ENABLED ? "#021550" : "#94A3B8" }}
          />
          <button
            type="submit"
            disabled={!NEWSLETTER_ENABLED}
            style={{ width: "100%", padding: 10, background: NEWSLETTER_ENABLED ? "#0329B2" : "#E2E8F0", color: NEWSLETTER_ENABLED ? "white" : "#94A3B8", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.8rem", cursor: NEWSLETTER_ENABLED ? "pointer" : "not-allowed" }}
          >
            Subscribe
          </button>
        </form>
        {!NEWSLETTER_ENABLED && <p style={{ fontSize: "0.68rem", color: "#94A3B8", margin: "8px 0 0" }}>Coming soon</p>}
      </div>

      {/* 7. Recently updated */}
      {recentPosts.length > 0 && (
        <div style={cardStyle}>
          <p style={eyebrowStyle}>Recently Updated</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ display: "block", textDecoration: "none" }}>
                <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#021550", lineHeight: 1.4, marginBottom: 2 }}>{post.title}</span>
                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>Updated {formatDate(post.updatedAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
