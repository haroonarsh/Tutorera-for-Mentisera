import Link from "next/link";
import type { Metadata } from "next";
import { formatPKR } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = {
  title: "Tutoring Services",
  description: "TUTORERA tutoring categories, learner levels, delivery modes, availability mechanism, and PKR pricing disclosure.",
  alternates: { canonical: "/services" },
};

const services = [
  ["Primary School Tutoring","Foundational tutoring for younger learners, homework support, reading, writing, numeracy, and concept confidence.","Primary learners","Online / In-person where offered","Primary","primary"],
  ["Middle School Tutoring","Academic support for middle-school learners across available subjects, schoolwork, revision, and study routines.","Middle-school students","Online / In-person where offered","Middle","middle"],
  ["Matric Tutoring","Board-focused tutoring for Matric students across science, commerce, humanities, languages, and exam revision.","Matric students","Online / In-person where offered","Matric","matric"],
  ["O-Level Tutoring","Cambridge O-Level tutoring for Mathematics, sciences, English, Pakistan Studies, Islamiyat, and commerce subjects.","O-Level students","Online / In-person where offered","O-Level","o-level"],
  ["Intermediate / FSc / ICS / FA","College-level support for FSc, ICS, FA, and related intermediate coursework and examination preparation.","Intermediate students","Online / In-person where offered","Intermediate","intermediate"],
  ["A-Level Tutoring","Cambridge AS/A2 tutoring from available tutors with relevant subject knowledge and experience.","A-Level students","Online / In-person where offered","A-Level","a-level"],
  ["University Tutoring","Legitimate learning support for university-level subjects without academic cheating or impersonation.","University students","Online / In-person where offered","University","university"],
  ["MDCAT Preparation","Concept review, practice support, and exam strategy for medical-college admission preparation.","MDCAT candidates","Online / In-person where offered","Test preparation","mdcat"],
  ["ECAT Preparation","Engineering-entry-test concept support, practice planning, and revision with available tutors.","ECAT candidates","Online / In-person where offered","Test preparation","ecat"],
  ["NTS Preparation","NTS and aptitude-test preparation support focused on concepts, practice, and test strategy.","NTS candidates","Online / In-person where offered","Test preparation","nts"],
  ["IELTS Preparation","English-language exam support for reading, writing, listening, speaking, and confidence building.","IELTS candidates","Online / In-person where offered","Language / test preparation","ielts"],
  ["SAT Preparation","SAT preparation support for math, reading, writing, practice planning, and exam technique.","SAT candidates","Online / In-person where offered","Test preparation","sat"],
  ["Language Tutoring","Language lessons for English, Urdu, Arabic, and other languages where approved tutors are available.","Language learners","Online / In-person where offered","All supported levels","languages"],
  ["Mathematics","Mathematics tutoring from primary foundations to advanced school and college topics where tutor inventory exists.","Math learners","Online / In-person where offered","Primary to university","mathematics"],
  ["Physics","Physics tutoring for school, college, O/A-Level, and test-prep learners.","Physics learners","Online / In-person where offered","Secondary to university","physics"],
  ["Chemistry","Chemistry tutoring for board, Cambridge, college, and test-preparation needs.","Chemistry learners","Online / In-person where offered","Secondary to university","chemistry"],
  ["Biology","Biology tutoring for school, college, O/A-Level, and MDCAT-related learning support.","Biology learners","Online / In-person where offered","Secondary to university","biology"],
  ["English","English tutoring for grammar, writing, literature, spoken confidence, and exam needs.","English learners","Online / In-person where offered","All supported levels","english"],
  ["Computer Science","Programming, computing concepts, web basics, CS theory, and practical digital-skills tutoring.","Technology learners","Online / In-person where offered","School to professional skills","computer-science"],
  ["Professional Skills","Skills tutoring where offered by approved tutors, including communication, tools, and work-relevant learning.","Adult and skills learners","Online / In-person where offered","Skills","skills"],
  ["Academic Support","Structured study support, revision help, learning planning, and subject-confidence assistance.","Students needing academic support","Online / In-person where offered","All supported levels","academic-support"],
];

export default function ServicesPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <h1>TUTORERA Tutoring Services</h1>
        <p>Services are tutoring categories, not fixed retail products. Rates vary by tutor, subject, level, experience, teaching mode, location, and student requirement. The final accepted rate is shown in PKR before checkout.</p>
      </section>
      <section className={s.narrow}>
        <p className={s.lead}><strong>Pricing:</strong> Tutor-specific. Final agreed rate is displayed in PKR before booking. Where live verified rate data exists, profiles and offers show the relevant PKR amount.</p>
      </section>
      <section className={s.container}>
        <div className={s.serviceGrid}>
          {services.map(([title, desc, learner, mode, level, slug]) => (
            <article key={title} className={s.serviceCard}>
              <div className={s.serviceImage} role="img" aria-label={`${title} education service illustration`}>{title.split(" ")[0]}</div>
              <div className={s.serviceBody}>
                <h2>{title}</h2>
                <p>{desc}</p>
                <div className={s.meta}>
                  <span><strong>Intended learner:</strong> {learner}</span>
                  <span><strong>Mode:</strong> {mode}</span>
                  <span><strong>Level:</strong> {level}</span>
                  <span><strong>Tutor availability mechanism:</strong> Subject to approved tutor inventory and schedule fit.</span>
                  <span><strong>Pricing mechanism:</strong> Tutor-specific offer pricing. Final agreed rate is displayed in PKR before booking.</span>
                  <span><strong>PKR reference:</strong> Example marketplace offers may show values such as {formatPKR(1500, "hour")}; final customer price depends on the accepted tutor offer.</span>
                </div>
                <div className={s.flow}>
                  <Link className={s.cta} href="/dashboard?tab=requests">Post Requirement</Link>
                  <Link className={s.cta} href={`/tutors/level/${slug}`}>View Tutors</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
