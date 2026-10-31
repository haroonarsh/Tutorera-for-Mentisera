import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Globe, Users, CheckCircle2,
  Star, Shield, Zap, Clock, DollarSign, GraduationCap,
} from "lucide-react";
import { getSubjectCatalogue, SUBJECT_GUIDES } from "@/lib/subject-catalogue";
import { SITE_URL } from "@/lib/site";
import styles from "./online-tutoring.module.css";

export const metadata: Metadata = {
  title: "Online Tutoring Pakistan | Expert Online Tutors | TUTORERA",
  description:
    "Find expert online tutors across Pakistan, UAE, UK and worldwide. Post a free requirement, compare verified tutor offers and book online tutoring for any subject or curriculum.",
  alternates: { canonical: "/online-tutoring" },
  openGraph: {
    title: "Online Tutoring | TUTORERA",
    description:
      "Expert online tutors for every subject. Post a free requirement and compare verified tutor offers — O-Levels, A-Levels, Matric, FSc, MDCAT, IELTS and more.",
    url: `${SITE_URL}/online-tutoring`,
  },
};

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "📐", Physics: "⚛️", Chemistry: "🧪", Biology: "🧬",
  English: "📝", Urdu: "🖊️", "Computer Science": "💻", Economics: "📊",
  Accounting: "🧾", "Business Studies": "💼", Islamiyat: "📖", "Pakistan Studies": "🗺️",
  Statistics: "📈", Sociology: "👥", Psychology: "🧠", History: "🏛️",
  Geography: "🌍", MDCAT: "🏥", ECAT: "⚙️", SAT: "🎓",
  IELTS: "🗣️", "Quran & Arabic": "☪️", "General Science": "🔬",
};

const LEVELS = [
  "Primary (Grades 1–5)", "Middle (Grades 6–8)", "Matric (9th & 10th)",
  "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)",
  "IB (Middle Years / Diploma)", "University / Degree", "Test Preparation",
];

const CURRICULA = [
  { name: "Cambridge O & A Level", flag: "🇬🇧" },
  { name: "Edexcel IGCSE / A Level", flag: "🇬🇧" },
  { name: "FBISE / Federal Board", flag: "🇵🇰" },
  { name: "Punjab Board", flag: "🇵🇰" },
  { name: "Sindh Board", flag: "🇵🇰" },
  { name: "AKU-EB", flag: "🇵🇰" },
  { name: "IB MYP / Diploma", flag: "🌍" },
  { name: "American Curriculum", flag: "🇺🇸" },
];

const FAQS = [
  {
    q: "How does online tutoring work on TUTORERA?",
    a: "Post a free requirement with your subject, curriculum, preferred schedule, timezone, and proposed budget. Verified tutors who match your criteria submit offers. You compare their qualifications, experience, and rates before accepting.",
  },
  {
    q: "Is online tutoring as effective as in-person?",
    a: "Online tutoring offers flexibility and access to a larger pool of verified tutors regardless of your city. Many students find it easier to schedule regular sessions and review recordings when available.",
  },
  {
    q: "Which curricula do TUTORERA tutors cover?",
    a: "Tutors state their approved curricula on their profiles — Cambridge, Edexcel, FBISE, Punjab Board, Sindh Board, AKU-EB, IB, and US/international curricula are all common. Specify your board when posting to get matched tutors.",
  },
  {
    q: "Can I get online tutoring from outside Pakistan?",
    a: "Yes. TUTORERA operates in Pakistan, UAE, UK and USA. Students worldwide can post requirements and receive offers from tutors in compatible timezones.",
  },
  {
    q: "How are online tutors verified?",
    a: "Every tutor completes identity and qualification checks. Subject approvals require evidence of qualifications for each subject they wish to offer. Tutors must pass all checks before accepting student requests.",
  },
  {
    q: "What platform is used for online sessions?",
    a: "Session delivery is agreed between student and tutor at booking. Common options include Zoom, Google Meet, and Microsoft Teams. TUTORERA handles the matching, pricing, and payment — not the video call itself.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "TUTORERA Online Tutoring",
  description:
    "Online tutoring marketplace — post a requirement, compare verified tutor offers, and book sessions for any subject.",
  url: `${SITE_URL}/online-tutoring`,
  provider: { "@type": "Organization", name: "TUTORERA", url: SITE_URL },
  serviceType: "Online Tutoring",
  areaServed: ["PK", "AE", "GB", "US"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Online Tutoring Subjects",
    url: `${SITE_URL}/subjects`,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default async function OnlineTutoringPage() {
  const { subjects, live } = await getSubjectCatalogue();

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}><Globe size={16} aria-hidden="true" /> Online tutoring</p>
          <h1>Expert online tutors,<br />for every subject and level.</h1>
          <p className={styles.lead}>
            Post a free requirement with your subject, curriculum, and budget.
            Verified tutors submit offers — you compare and choose. No upfront payment until you accept.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryLight} href="/post-tuition-request?mode=online">
              Post a free requirement <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryLight} href="/tutors?mode=online">
              Browse online tutors
            </Link>
          </div>
        </div>
        <div className={styles.statsBar}>
          <div className={styles.wrap}>
            <div className={styles.statsRow}>
              {[
                { icon: <BookOpen size={18} />, value: "25+", label: "Subjects" },
                { icon: <GraduationCap size={18} />, value: "All levels", label: "Primary to University" },
                { icon: <Globe size={18} />, value: "PK · UAE · UK · USA", label: "4 markets" },
                { icon: <DollarSign size={18} />, value: "Free to post", label: "No signup fee" },
              ].map((s) => (
                <div key={s.label} className={styles.statItem}>
                  {s.icon}<strong>{s.value}</strong><span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={`${styles.wrap} ${styles.howSection}`} aria-labelledby="how-heading">
        <p className={styles.kicker}>HOW IT WORKS</p>
        <h2 id="how-heading">From requirement to first session in three steps</h2>
        <div className={styles.stepsRow}>
          {[
            {
              n: "1", icon: <BookOpen size={28} aria-hidden="true" />,
              title: "Post your requirement",
              text: "Choose subject, class level, curriculum, preferred schedule, timezone and budget. Takes two minutes, completely free.",
            },
            {
              n: "2", icon: <Users size={28} aria-hidden="true" />,
              title: "Compare tutor offers",
              text: "Approved tutors matching your criteria submit offers. Review qualifications, experience, and rates side by side.",
            },
            {
              n: "3", icon: <CheckCircle2 size={28} aria-hidden="true" />,
              title: "Accept and start learning",
              text: "Accept the offer that fits. Payment is handled securely through TUTORERA and released after sessions are confirmed.",
            },
          ].map((step) => (
            <div key={step.n} className={styles.stepCard}>
              <div className={styles.stepIcon}>{step.icon}</div>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subjects grid ── */}
      <section className={styles.subjectsSection} aria-labelledby="subjects-heading">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.kicker}>SUBJECTS</p>
              <h2 id="subjects-heading">Online tutoring for every subject</h2>
              <p>From primary maths to A-Level Physics — find a verified tutor for any subject.</p>
            </div>
            <Link className={styles.outlineBlue} href="/subjects">
              View full catalogue <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {!live && (
            <p className={styles.notice}>Showing reference catalogue — live updates temporarily unavailable.</p>
          )}
          <div className={styles.subjectGrid}>
            {subjects.slice(0, 18).map((subject) => (
              <Link
                key={subject.slug}
                href={`/subjects/${subject.slug}`}
                className={styles.subjectCard}
              >
                <span className={styles.subjectEmoji} aria-hidden="true">
                  {SUBJECT_ICONS[subject.name] || "📚"}
                </span>
                <span className={styles.subjectName}>{subject.name}</span>
                <span className={styles.subjectHint}>
                  {SUBJECT_GUIDES[subject.name]?.topics?.[0] || "Explore this subject"}
                </span>
                <span className={styles.subjectLink}>Find a tutor <ArrowRight size={13} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
          <div className={styles.seeAll}>
            <Link href="/subjects" className={styles.outlineBlue}>
              See all {subjects.length} subjects <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Class levels ── */}
      <section className={`${styles.wrap} ${styles.levelsSection}`} aria-labelledby="levels-heading">
        <p className={styles.kicker}>CLASS LEVELS</p>
        <h2 id="levels-heading">Online tutoring at every level</h2>
        <div className={styles.levelsGrid}>
          {LEVELS.map((level) => (
            <Link
              key={level}
              href={`/post-tuition-request?level=${encodeURIComponent(level)}&mode=online`}
              className={styles.levelChip}
            >
              {level}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Curricula ── */}
      <section className={`${styles.wrap} ${styles.curriculaSection}`} aria-labelledby="curricula-heading">
        <p className={styles.kicker}>CURRICULA</p>
        <h2 id="curricula-heading">All major boards and curricula</h2>
        <p className={styles.sectionLead}>Specify your board when posting — tutors state their curriculum approvals on their profiles.</p>
        <div className={styles.curriculaGrid}>
          {CURRICULA.map((c) => (
            <div key={c.name} className={styles.curriculaCard}>
              <span className={styles.flag} aria-hidden="true">{c.flag}</span>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why online tutoring ── */}
      <section className={styles.whySection} aria-labelledby="why-heading">
        <div className={styles.wrap}>
          <p className={styles.kickerLight}>WHY ONLINE TUTORING ON TUTORERA</p>
          <h2 id="why-heading">Built around your convenience</h2>
          <div className={styles.whyGrid}>
            {[
              {
                icon: <Globe size={24} aria-hidden="true" />,
                title: "Tutors across four markets",
                text: "Access verified tutors in Pakistan, UAE, UK, and USA — matched to your timezone and curriculum.",
              },
              {
                icon: <Shield size={24} aria-hidden="true" />,
                title: "Verified qualifications",
                text: "Every tutor undergoes identity and subject-level qualification checks before being approved.",
              },
              {
                icon: <DollarSign size={24} aria-hidden="true" />,
                title: "You propose the price",
                text: "Post your budget. Tutors can accept or make a transparent counter-offer. No hidden fees for students.",
              },
              {
                icon: <Zap size={24} aria-hidden="true" />,
                title: "Fast matching",
                text: "Relevant tutors are notified when you post. Start receiving offers typically within hours.",
              },
              {
                icon: <Clock size={24} aria-hidden="true" />,
                title: "Flexible scheduling",
                text: "Morning, evening, weekdays or weekends — set your schedule in the requirement and tutors respond accordingly.",
              },
              {
                icon: <Star size={24} aria-hidden="true" />,
                title: "Compare before you commit",
                text: "Review multiple offers with qualifications and rates before accepting. No pressure to choose fast.",
              },
            ].map((item) => (
              <div key={item.title} className={styles.whyCard}>
                <span className={styles.whyIcon}>{item.icon}</span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={`${styles.wrap} ${styles.faqSection}`} aria-labelledby="faq-heading">
        <p className={styles.kicker}>COMMON QUESTIONS</p>
        <h2 id="faq-heading">Online tutoring — FAQs</h2>
        <div className={styles.faqGrid}>
          {FAQS.map((faq) => (
            <div key={faq.q} className={styles.faqItem}>
              <strong>{faq.q}</strong>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related ── */}
      <section className={`${styles.wrap} ${styles.relatedSection}`} aria-labelledby="related-heading">
        <p className={styles.kicker}>EXPLORE MORE</p>
        <h2 id="related-heading">Not sure where to start?</h2>
        <div className={styles.relatedGrid}>
          <Link href="/subjects" className={styles.relatedCard}>
            <BookOpen size={28} aria-hidden="true" />
            <strong>Browse subjects</strong>
            <p>Open any subject page for topic guides and a direct link to post your requirement.</p>
            <span className={styles.relatedLink}>View all subjects <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
          <Link href="/tutors" className={styles.relatedCard}>
            <Users size={28} aria-hidden="true" />
            <strong>Browse tutors</strong>
            <p>See approved tutors, filter by subject, city, and teaching mode.</p>
            <span className={styles.relatedLink}>Browse tutors <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
          <Link href="/post-tuition-request" className={styles.relatedCard}>
            <Zap size={28} aria-hidden="true" />
            <strong>Post a requirement</strong>
            <p>Ready to go? Post a free requirement in two minutes and start receiving offers.</p>
            <span className={styles.relatedLink}>Get started <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className={styles.bottomCta}>
        <div className={styles.wrap}>
          <h2>Start learning online today.</h2>
          <p>Post a free requirement in two minutes. No upfront payment until you accept a tutor offer.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryLight} href="/post-tuition-request?mode=online">
              Post a free requirement <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryLight} href="/subjects">
              Explore subjects
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
