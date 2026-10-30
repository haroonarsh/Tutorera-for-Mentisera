import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Search } from "lucide-react";
import { getSubjectCatalogue, SUBJECT_GUIDES } from "@/lib/subject-catalogue";
import styles from "./subjects.module.css";

export default async function SubjectsPage() {
  const { subjects, live } = await getSubjectCatalogue();
  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.wrap}>
        <p className={styles.eyebrow}><BookOpen size={16} aria-hidden="true" /> Explore subjects</p>
        <h1>Find support for what you want to learn.</h1>
        <p className={styles.lead}>Choose a subject, describe your goals and budget, and compare offers from tutors who are approved to teach it.</p>
        <div className={styles.actions}><Link className={styles.primaryLight} href="/post-tuition-request">Post a requirement <ArrowRight size={18} aria-hidden="true" /></Link><Link className={styles.secondaryLight} href="/tutors">Browse tutors</Link></div>
      </div>
    </section>
    <section className={styles.wrap} aria-labelledby="subjects-heading">
      <div className={styles.sectionHead}><div><p className={styles.kicker}>YOUR LEARNING, YOUR CHOICE</p><h2 id="subjects-heading">Explore the subject catalogue</h2><p>Open a subject to see suggested learning areas and how to request a tutor.</p></div><div className={styles.count}><Search size={18} aria-hidden="true" /> {subjects.length} catalogue subjects</div></div>
      {!live && <p className={styles.notice} role="status">Showing the reference catalogue while live catalogue updates are unavailable. Availability can change.</p>}
      {subjects.length === 0 ? <p className={styles.notice}>There are no active subjects in the catalogue right now. You can contact support for help.</p> : <div className={styles.grid}>
        {subjects.map((subject) => <Link className={styles.card} href={`/subjects/${encodeURIComponent(subject.slug)}`} key={subject.slug}>
          <span className={styles.cardIcon}><GraduationCap size={22} aria-hidden="true" /></span><span className={styles.cardTitle}>{subject.name}</span>
          <span className={styles.cardText}>{SUBJECT_GUIDES[subject.name]?.summary || `Explore personalised ${subject.name} tutoring and share your learning goals.`}</span>
          <span className={styles.cardLink}>Explore subject <ArrowRight size={16} aria-hidden="true" /></span>
        </Link>)}
      </div>}
      <aside className={styles.school}><div><p className={styles.kicker}>A DIFFERENT WAY TO LEARN</p><h2>Looking for structured online school?</h2><p>MENTISERA Virtual School offers separate school programmes. Explore its admissions and current terms on the MENTISERA website.</p></div><a className={styles.outline} href="https://mentisera.ac.pk/online-school">Explore MENTISERA online school <ArrowRight size={16} aria-hidden="true" /></a></aside>
    </section>
  </main>;
}
