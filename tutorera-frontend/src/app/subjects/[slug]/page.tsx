import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import { getSubjectCatalogue, SUBJECT_GUIDES } from "@/lib/subject-catalogue";
import { SITE_URL } from "@/lib/site";
import styles from "../subjects.module.css";

type Props = { params: Promise<{ slug: string }> };

async function findSubject(slug: string) {
  const catalogue = await getSubjectCatalogue();
  return { subject: catalogue.subjects.find((item) => item.slug === slug), live: catalogue.live };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { subject } = await findSubject(slug);
  if (!subject) return {};
  return {
    title: `${subject.name} Tutoring`,
    description: `Post a ${subject.name} tuition requirement and compare tutor offers on TUTORERA.`,
    alternates: { canonical: `/subjects/${subject.slug}` },
  };
}

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params;
  const { subject, live } = await findSubject(slug);
  if (!subject) notFound();
  const guide = SUBJECT_GUIDES[subject.name];
  const requestUrl = `/post-tuition-request?subject=${encodeURIComponent(subject.name)}`;
  const browseUrl = `/tutors?subject=${encodeURIComponent(subject.name)}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: `${subject.name} Tutoring`,
    description: guide?.summary || `Find personalised support for ${subject.name}, matched to your learning goals.`,
    url: `${SITE_URL}/subjects/${subject.slug}`,
    provider: {
      "@type": "Organization",
      name: "TUTORERA",
      url: SITE_URL,
    },
    educationalCredentialAwarded: "Not applicable — marketplace tutoring, not a qualification-awarding programme",
    occupationalCategory: subject.name,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Subjects", item: `${SITE_URL}/subjects` },
        { "@type": "ListItem", position: 3, name: subject.name, item: `${SITE_URL}/subjects/${subject.slug}` },
      ],
    },
  };

  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <section className={styles.hero}><div className={styles.wrap}>
      <Link className={styles.back} href="/subjects"><ArrowLeft size={16} aria-hidden="true" /> All subjects</Link>
      <p className={styles.eyebrow}><GraduationCap size={16} aria-hidden="true" /> SUBJECT GUIDE</p>
      <h1>{subject.name} tutoring</h1>
      <p className={styles.lead}>{guide?.summary || `Find personalised support for ${subject.name}, matched to your learning goals.`}</p>
      <div className={styles.actions}><Link className={styles.primaryLight} href={requestUrl}>Request {subject.name} tuition <ArrowRight size={18} aria-hidden="true" /></Link><Link className={styles.secondaryLight} href={browseUrl}>Browse matching tutors</Link></div>
    </div></section>
    <div className={`${styles.wrap} ${styles.detailGrid}`}>
      <div>
        {!live && <p className={styles.notice} role="status">This page uses the reference catalogue while live catalogue updates are unavailable. Check the request form for current options.</p>}
        {guide && <section className={styles.panel}><h2>Areas you could explore</h2><p>Tell your tutor which topics and curriculum matter to you. The lesson plan depends on your needs and the tutor&apos;s approved teaching levels.</p><ul className={styles.topics}>{guide.topics.map((topic) => <li key={topic}><CheckCircle2 size={18} aria-hidden="true" /> {topic}</li>)}</ul></section>}
        <section className={styles.panel}><h2>How to get started</h2><ol className={styles.steps}><li>Post your subject, level, schedule, preferred mode and proposed budget.</li><li>Compare the offers you receive, including qualifications and availability.</li><li>Choose an offer and follow the payment and booking steps available in your market.</li></ol><p>Tutor availability and rates vary by subject, level, location and teaching mode. Posting a request does not guarantee an offer.</p></section>
      </div>
      <aside><div className={styles.panel}><h2>For tutors</h2><p>Want to teach {subject.name}? Submit your qualifications and request approval for the relevant subject and levels. Approval is required before offering lessons.</p><Link className={styles.outline} href="/become-a-tutor">Become a tutor <ArrowRight size={16} aria-hidden="true" /></Link></div><div className={styles.panel}><h2>Structured school programmes</h2><p>For MENTISERA&apos;s separate online-school programmes, check their site for current subjects and admission terms.</p><a className={styles.textLink} href="https://mentisera.ac.pk/online-school/subjects">Explore the online school <ArrowRight size={16} aria-hidden="true" /></a></div></aside>
    </div>
  </main>;
}
