import type { BlogHeading } from "@/lib/blog-markdown";

export default function BlogTableOfContents({ headings }: { headings: BlogHeading[] }) {
  if (headings.length < 2) return null; // Not worth a TOC for a one-or-two-section post.

  return (
    <nav
      aria-label="Table of contents"
      style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1.1rem 1.25rem", marginBottom: 24 }}
    >
      <p style={{ margin: "0 0 0.6rem", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748B" }}>
        In this guide
      </p>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {headings.map((heading, index) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              style={{ display: "flex", gap: "0.6rem", color: "#334155", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", lineHeight: 1.5 }}
            >
              <span style={{ color: "#94A3B8", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{index + 1}.</span>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
