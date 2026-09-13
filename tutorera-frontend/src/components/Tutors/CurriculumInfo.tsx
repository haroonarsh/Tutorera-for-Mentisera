import type { CurriculumTopic } from "@/lib/curriculum-content";
import { UI_COLORS, TEXT_COLORS } from "@/lib/brand";

const C = UI_COLORS;

export default function CurriculumInfo({ content }: { content: CurriculumTopic }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 1rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <p style={{ fontSize: "1.02rem", lineHeight: 1.7, color: TEXT_COLORS.body, maxWidth: 820, marginBottom: "2rem" }}>
        {content.intro}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.875rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.primary, margin: "0 0 1rem" }}>Topics Covered</h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", color: TEXT_COLORS.secondary, lineHeight: 1.9 }}>
            {content.topics.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.875rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.primary, margin: "0 0 1rem" }}>Exam Boards & Syllabi</h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", color: TEXT_COLORS.secondary, lineHeight: 1.9 }}>
            {content.examBoards.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.primary, margin: "0 0 0.6rem" }}>Who This Is For</h2>
          <p style={{ color: TEXT_COLORS.secondary, lineHeight: 1.7, margin: 0 }}>{content.whoItsFor}</p>
        </div>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.primary, margin: "0 0 0.6rem" }}>Why Use a Tutor</h2>
          <p style={{ color: TEXT_COLORS.secondary, lineHeight: 1.7, margin: 0 }}>{content.whyTutoring}</p>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: C.primary, margin: "0 0 1rem" }}>Frequently Asked Questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {content.faq.map((item) => (
            <div key={item.q} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "1rem" }}>
              <p style={{ fontWeight: 700, color: C.primary, margin: "0 0 0.4rem", fontSize: "0.95rem" }}>{item.q}</p>
              <p style={{ color: TEXT_COLORS.secondary, margin: 0, lineHeight: 1.6, fontSize: "0.9rem" }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
