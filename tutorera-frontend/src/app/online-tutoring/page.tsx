import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe2,
  Laptop,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getSubjectCatalogue, SUBJECT_GUIDES } from "@/lib/subject-catalogue";
import { SITE_URL } from "@/lib/site";
import styles from "./online-tutoring.module.css";

export const metadata: Metadata = {
  title: "Online Tutoring | Find the Right Tutor for Every Subject | TUTORERA",
  description:
    "Find online tutors for school subjects, exam preparation, languages and university study. Post your requirement, compare eligible offers and learn from anywhere.",
  alternates: { canonical: "/online-tutoring" },
  openGraph: {
    title: "Online Tutoring for Every Subject | TUTORERA",
    description:
      "Connect with eligible online tutors for your subject, curriculum and schedule.",
    url: `${SITE_URL}/online-tutoring`,
  },
};

const CATEGORIES = [
  {
    label: "Science & mathematics",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "Statistics", "General Science"],
    intro: "Build strong concepts, practise problems and prepare for the next assessment.",
  },
  {
    label: "Languages & communication",
    subjects: ["English", "Urdu", "IELTS", "Quran & Arabic"],
    intro: "Develop confident reading, writing, speaking and comprehension with focused support.",
  },
  {
    label: "Commerce & social sciences",
    subjects: ["Economics", "Accounting", "Business Studies", "Sociology", "Psychology"],
    intro: "Turn complex theories and real-world examples into a clear, practical study plan.",
  },
  {
    label: "Humanities & computing",
    subjects: ["History", "Geography", "Pakistan Studies", "Islamiyat", "Computer Science"],
    intro: "Learn through discussion, structured notes, source analysis and hands-on practice.",
  },
  {
    label: "Admissions & test preparation",
    subjects: ["MDCAT", "ECAT", "SAT"],
    intro: "Prepare with targeted revision, timed practice and feedback on the questions you miss.",
  },
];

const FAQS = [
  {
    q: "How do I arrange an online tutor?",
    a: "Post a free requirement with your subject, level, curriculum, timezone, schedule and proposed budget. Eligible tutors can respond with offers for you to compare before choosing.",
  },
  {
    q: "Can I find a tutor for my specific curriculum?",
    a: "Yes. Include your board or curriculum in the request, such as Cambridge, Edexcel, IB, Matric, Intermediate or an entrance test. Tutor profiles and offers include their relevant experience.",
  },
  {
    q: "Do I need to pay to post a requirement?",
    a: "No. Posting a requirement is free. Payment and booking steps are shown after you choose an offer, subject to the availability of the selected market.",
  },
  {
    q: "Can online lessons work across timezones?",
    a: "Yes. Add your timezone and preferred time windows to the request so tutors can respond when their availability matches.",
  },
];

const BENEFITS = [
  { icon: <MessageCircle size={22} aria-hidden="true" />, title: "A plan built around you", text: "Share your goal, current level and schedule so offers reflect what you actually need." },
  { icon: <ShieldCheck size={22} aria-hidden="true" />, title: "Eligible tutor offers", text: "Tutors complete identity and qualification checks before they can accept relevant requests." },
  { icon: <Globe2 size={22} aria-hidden="true" />, title: "Learn from anywhere", text: "Connect across supported markets without giving up the convenience of online lessons." },
  { icon: <Sparkles size={22} aria-hidden="true" />, title: "Compare before choosing", text: "Review experience, availability and pricing before accepting the offer that fits." },
];

export default async function OnlineTutoringPage() {
  const { subjects, live } = await getSubjectCatalogue();
  const subjectByName = new Map(subjects.map((subject) => [subject.name, subject]));
  const groupedNames = new Set(CATEGORIES.flatMap((category) => category.subjects));
  const otherSubjects = subjects.filter((subject) => !groupedNames.has(subject.name));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Online tutoring subjects",
    url: `${SITE_URL}/online-tutoring`,
    numberOfItems: subjects.length,
    itemListElement: subjects.map((subject, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: subject.name,
      url: `${SITE_URL}/subjects/${subject.slug}`,
    })),
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}><Laptop size={16} aria-hidden="true" /> Online tutoring</p>
              <h1>One place to find the right online tutor.</h1>
              <p className={styles.lead}>
                Whether you are preparing for an exam, catching up on a difficult topic or building a new skill, find focused support for your subject and schedule.
              </p>
              <div className={styles.actions}>
                <Link className={styles.primaryLight} href="/post-online-tuition-request">Post an online requirement <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link className={styles.secondaryLight} href="/online-tutors">Browse online tutors</Link>
              </div>
              <div className={styles.trustLine}><CheckCircle2 size={17} aria-hidden="true" /> Free to post · Compare offers · Choose with confidence</div>
            </div>
            <div className={styles.heroCard}>
              <div className={styles.heroCardIcon}><BookOpen size={24} aria-hidden="true" /></div>
              <strong>From your goal to your first lesson</strong>
              <ol>
                <li><span>1</span> Tell us what you want to learn.</li>
                <li><span>2</span> Compare eligible tutor offers.</li>
                <li><span>3</span> Choose a tutor and arrange your lessons.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.benefitSection} aria-labelledby="benefits-heading">
        <div className={styles.wrap}>
          <p className={styles.kicker}>WHY ONLINE LEARNING</p>
          <h2 id="benefits-heading">Flexible support that starts with your needs</h2>
          <div className={styles.benefitGrid}>
            {BENEFITS.map((benefit) => (
              <article className={styles.benefitCard} key={benefit.title}>
                <span>{benefit.icon}</span>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.catalogue} aria-labelledby="catalogue-heading">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.kicker}>EXPLORE BY SUBJECT</p>
              <h2 id="catalogue-heading">Online tutoring for every learning goal</h2>
              <p>Choose a subject to see useful starting points, then post a request tailored to your level.</p>
            </div>
            <span className={styles.count}>{subjects.length} subjects</span>
          </div>
          {!live && <p className={styles.notice} role="status">Showing the reference catalogue while live subject updates are unavailable.</p>}
          {CATEGORIES.map((category) => {
            const categorySubjects = category.subjects.map((name) => subjectByName.get(name)).filter((subject): subject is NonNullable<typeof subject> => Boolean(subject));
            if (!categorySubjects.length) return null;
            return (
              <div className={styles.category} key={category.label}>
                <div className={styles.categoryIntro}>
                  <h3>{category.label}</h3>
                  <p>{category.intro}</p>
                </div>
                <div className={styles.subjectGrid}>
                  {categorySubjects.map((subject) => (
                    <Link className={styles.subjectCard} href={`/subjects/${encodeURIComponent(subject.slug)}`} key={subject.slug}>
                      <strong>{subject.name}</strong>
                      <span>{SUBJECT_GUIDES[subject.name]?.summary || `Find online ${subject.name} tutoring.`}</span>
                      <span className={styles.cardLink}>Explore {subject.name} <ArrowRight size={15} aria-hidden="true" /></span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          {otherSubjects.length > 0 && (
            <div className={styles.category}>
              <div className={styles.categoryIntro}><h3>More subjects</h3><p>Browse additional subjects available in the current catalogue.</p></div>
              <div className={styles.subjectGrid}>
                {otherSubjects.map((subject) => (
                  <Link className={styles.subjectCard} href={`/subjects/${encodeURIComponent(subject.slug)}`} key={subject.slug}>
                    <strong>{subject.name}</strong><span>Find personalised online {subject.name} tutoring.</span><span className={styles.cardLink}>Explore subject <ArrowRight size={15} aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={styles.levelSection} aria-labelledby="levels-heading">
        <div className={styles.wrap}>
          <div>
            <p className={styles.kicker}>BUILT FOR YOUR STAGE</p>
            <h2 id="levels-heading">Support from first concepts to advanced study</h2>
            <p>Tell tutors whether you need primary foundations, school exam preparation, university support or a focused admissions plan.</p>
          </div>
          <div className={styles.levelGrid}>
            {["Primary & middle school", "Matric, O-Level & GCSE", "A-Level, IB & Intermediate", "University & test preparation"].map((level) => (
              <Link href={`/post-online-tuition-request?level=${encodeURIComponent(level)}`} className={styles.levelCard} key={level}>
                <span>{level}</span><ArrowRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <div className={styles.wrap}>
          <p className={styles.kicker}>COMMON QUESTIONS</p>
          <h2 id="faq-heading">Online tutoring, made clear</h2>
          <div className={styles.faqList}>
            {FAQS.map((faq) => <details className={styles.faqItem} key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}
          </div>
        </div>
      </section>

      <section className={styles.bottomCta}>
        <div className={styles.wrap}>
          <h2>Ready to make progress?</h2>
          <p>Share what you need and let suitable tutors come to you.</p>
          <Link className={styles.primaryDark} href="/post-online-tuition-request">Start your free request <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
