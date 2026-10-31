import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Search, Users, CheckCircle2, Star, Globe } from "lucide-react";
import { getSubjectCatalogue, SUBJECT_GUIDES } from "@/lib/subject-catalogue";
import { SITE_URL } from "@/lib/site";
import styles from "./subjects.module.css";

export const metadata: Metadata = {
  title: "Online Tutoring Subjects | Expert Tutors for Every Subject | TUTORERA",
  description: "Find expert tutors across 25+ subjects — Maths, Physics, Chemistry, English, O-Levels, A-Levels, Matric and more. Post your requirement, compare offers, and choose your tutor.",
  alternates: { canonical: "/subjects" },
  openGraph: {
    title: "Online Tutoring Subjects | TUTORERA",
    description: "Expert tutors for every subject. Post a free requirement and compare verified tutor offers across Pakistan, UAE, UK and beyond.",
    url: `${SITE_URL}/subjects`,
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

const SUBJECT_CATEGORIES: { label: string; subjects: string[] }[] = [
  { label: "Science & Mathematics", subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "General Science", "Statistics"] },
  { label: "Languages", subjects: ["English", "Urdu", "Quran & Arabic", "IELTS"] },
  { label: "Commerce & Social", subjects: ["Economics", "Accounting", "Business Studies", "Sociology", "Psychology"] },
  { label: "Humanities", subjects: ["History", "Geography", "Pakistan Studies", "Islamiyat"] },
  { label: "Computing", subjects: ["Computer Science"] },
  { label: "Entrance & Test Prep", subjects: ["MDCAT", "ECAT", "SAT"] },
];

const STATS = [
  { icon: <BookOpen size={20} aria-hidden="true" />, value: "25+", label: "Subjects covered" },
  { icon: <Users size={20} aria-hidden="true" />, value: "All levels", label: "Primary to University" },
  { icon: <Globe size={20} aria-hidden="true" />, value: "4 markets", label: "PK · UAE · UK · USA" },
  { icon: <Star size={20} aria-hidden="true" />, value: "Free to post", label: "No upfront payment" },
];

const FAQS = [
  { q: "Which subjects can I get tutoring for?", a: "TUTORERA covers 25+ subjects across sciences, languages, commerce, humanities, computing, and entrance test preparation. Each subject page shows suggested areas and how to post a request." },
  { q: "How do I find a tutor for my subject?", a: "Post a free tuition request with your subject, class level, schedule, and proposed budget. Verified tutors matching your criteria will submit offers for you to compare." },
  { q: "Are tutors approved to teach specific subjects?", a: "Yes. Every tutor on TUTORERA goes through a subject-level approval process. Tutors must provide evidence of their qualifications for each subject they wish to offer." },
  { q: "Can I get tutoring for O-Level or A-Level subjects?", a: "Yes. You can specify your curriculum (Cambridge, Edexcel, etc.) and class when posting your request. Tutors state their curriculum experience on their profiles." },
];

export default async function SubjectsPage() {
  const { subjects, live } = await getSubjectCatalogue();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "TUTORERA Subject Catalogue",
    description: "Online tutoring subjects available on TUTORERA — find a verified tutor for any subject.",
    url: `${SITE_URL}/subjects`,
    numberOfItems: subjects.length,
    itemListElement: subjects.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/subjects/${s.slug}`,
    })),
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}><BookOpen size={16} aria-hidden="true" /> Subject catalogue</p>
          <h1>Expert tutors for every subject.</h1>
          <p className={styles.lead}>Post a free requirement with your subject, level, and budget. Verified tutors submit offers — you compare and choose.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryLight} href="/post-tuition-request">Post a free requirement <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className={styles.secondaryLight} href="/tutors">Browse verified tutors</Link>
          </div>
        </div>
        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.wrap}>
            <div className={styles.statsRow}>
              {STATS.map((s) => (
                <div key={s.label} className={styles.statItem}>
                  {s.icon}
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`${styles.wrap} ${styles.howSection}`} aria-labelledby="how-heading">
        <p className={styles.kicker}>HOW IT WORKS</p>
        <h2 id="how-heading">Three steps to your tutor</h2>
        <div className={styles.stepsRow}>
          {[
            { n: "1", title: "Pick your subject", text: "Browse the catalogue, open a subject page, and hit 'Request tuition'." },
            { n: "2", title: "Post your requirement", text: "Describe your level, schedule, and proposed budget. It's free and takes two minutes." },
            { n: "3", title: "Compare & choose", text: "Verified tutors submit offers. Compare qualifications and rates, then accept the best fit." },
          ].map((step) => (
            <div key={step.n} className={styles.stepCard}>
              <span className={styles.stepNum}>{step.n}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subject catalogue — by category */}
      <section className={styles.wrap} aria-labelledby="subjects-heading">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>YOUR LEARNING, YOUR CHOICE</p>
            <h2 id="subjects-heading">Browse the full subject catalogue</h2>
            <p>Open any subject to see suggested topics and how to request a tutor.</p>
          </div>
          <div className={styles.count}><Search size={18} aria-hidden="true" /> {subjects.length} subjects</div>
        </div>
        {!live && <p className={styles.notice} role="status">Showing the reference catalogue — live updates temporarily unavailable. Availability may vary.</p>}
        {subjects.length === 0 ? (
          <p className={styles.notice}>No active subjects in the catalogue right now. Contact support for help.</p>
        ) : (
          <>
            {SUBJECT_CATEGORIES.map((cat) => {
              const catSubjects = subjects.filter((s) => cat.subjects.includes(s.name));
              if (!catSubjects.length) return null;
              return (
                <div key={cat.label} className={styles.catSection}>
                  <h3 className={styles.catLabel}>{cat.label}</h3>
                  <div className={styles.grid}>
                    {catSubjects.map((subject) => (
                      <Link className={styles.card} href={`/subjects/${encodeURIComponent(subject.slug)}`} key={subject.slug}>
                        <span className={styles.cardIcon} aria-hidden="true">{SUBJECT_ICONS[subject.name] || "📚"}</span>
                        <span className={styles.cardTitle}>{subject.name}</span>
                        <span className={styles.cardText}>{SUBJECT_GUIDES[subject.name]?.summary || `Explore personalised ${subject.name} tutoring.`}</span>
                        <span className={styles.cardLink}>Explore subject <ArrowRight size={16} aria-hidden="true" /></span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Any subject not in a category */}
            {(() => {
              const categorised = SUBJECT_CATEGORIES.flatMap((c) => c.subjects);
              const uncategorised = subjects.filter((s) => !categorised.includes(s.name));
              if (!uncategorised.length) return null;
              return (
                <div className={styles.catSection}>
                  <h3 className={styles.catLabel}>Other subjects</h3>
                  <div className={styles.grid}>
                    {uncategorised.map((subject) => (
                      <Link className={styles.card} href={`/subjects/${encodeURIComponent(subject.slug)}`} key={subject.slug}>
                        <span className={styles.cardIcon} aria-hidden="true">{SUBJECT_ICONS[subject.name] || "📚"}</span>
                        <span className={styles.cardTitle}>{subject.name}</span>
                        <span className={styles.cardText}>{SUBJECT_GUIDES[subject.name]?.summary || `Explore personalised ${subject.name} tutoring.`}</span>
                        <span className={styles.cardLink}>Explore subject <ArrowRight size={16} aria-hidden="true" /></span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </section>

      {/* Why TUTORERA */}
      <section className={`${styles.whySection}`} aria-labelledby="why-heading">
        <div className={styles.wrap}>
          <p className={styles.kicker}>WHY TUTORERA</p>
          <h2 id="why-heading">A marketplace built around the student</h2>
          <div className={styles.whyGrid}>
            {[
              { icon: <CheckCircle2 size={22} aria-hidden="true" />, title: "You set the price", text: "Post your proposed rate. Tutors accept or make a transparent counter-offer — no hidden fees for students." },
              { icon: <CheckCircle2 size={22} aria-hidden="true" />, title: "Verified tutors only", text: "Every tutor completes identity and qualification checks before being approved to accept requests." },
              { icon: <CheckCircle2 size={22} aria-hidden="true" />, title: "All curricula welcome", text: "Cambridge, Edexcel, FBISE, Punjab Board, AKU-EB, IB and more — specify your board when posting." },
              { icon: <CheckCircle2 size={22} aria-hidden="true" />, title: "Online & home tuition", text: "Find online tutors worldwide or nearby home tutors in your city and area." },
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

      {/* FAQ */}
      <section className={styles.wrap} aria-labelledby="faq-heading">
        <p className={styles.kicker}>COMMON QUESTIONS</p>
        <h2 id="faq-heading">Frequently asked questions</h2>
        <div className={styles.faqList}>
          {FAQS.map((faq) => (
            <div key={faq.q} className={styles.faqItem}>
              <strong>{faq.q}</strong>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MENTISERA school cross-link */}
      <div className={styles.wrap}>
        <aside className={styles.school}>
          <div>
            <p className={styles.kicker}>A DIFFERENT WAY TO LEARN</p>
            <h2>Looking for structured online school?</h2>
            <p>MENTISERA Virtual School offers separate online school programmes with enrolled classes and structured terms. Explore admissions on the MENTISERA website.</p>
          </div>
          <a className={styles.outline} href="https://mentisera.ac.pk/online-school">Explore MENTISERA online school <ArrowRight size={16} aria-hidden="true" /></a>
        </aside>
      </div>

      {/* Bottom CTA */}
      <section className={styles.bottomCta}>
        <div className={styles.wrap}>
          <h2>Ready to find your tutor?</h2>
          <p>Post a free requirement in two minutes. No upfront payment until you accept an offer.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryLight} href="/post-tuition-request">Post a free requirement <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className={styles.secondaryLight} href="/online-tutoring">Explore online tutoring <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
