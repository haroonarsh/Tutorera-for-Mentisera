import Link from "next/link";
import type { Metadata } from "next";
import { formatPKR } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = { title: "Tutoring Services", description: "TUTORERA tutoring service categories, teaching modes, learner levels, and PKR pricing mechanism.", alternates: { canonical: "/services" } };

const services = [
  ["Primary School Tutoring","One-to-one educational support for primary-level learners. Tutors can help with foundational numeracy, reading, writing, homework confidence, and concept revision. Parents can compare available tutors by subject, mode, rate, and availability.","Primary learners","Online / In-person where offered","Primary","Find a Primary Tutor","primary"],
  ["Middle School Tutoring","Academic support for middle-school learners across available subjects. Sessions may focus on schoolwork, concept building, exam preparation, and study routines. Final rates are confirmed in PKR before booking.","Middle-school students","Online / In-person where offered","Middle","Find Middle School Tutors","middle"],
  ["Matric Tutoring","Subject-based tutoring and board examination preparation for Matric students. Students can find tutors for science, commerce, humanities, languages, and exam revision according to available tutor inventory.","Matric students","Online / In-person where offered","Matric","Find Matric Tutors","matric"],
  ["O-Level Tutoring","Cambridge O-Level academic tutoring for common subject categories including Mathematics, sciences, English, Pakistan Studies, Islamiyat, and commerce subjects. Tutor profiles show experience and rate information where available.","O-Level students","Online / In-person where offered","O-Level","Find O-Level Tutors","o-level"],
  ["Intermediate / FSc / ICS / FA Tutoring","Academic support for intermediate-level students preparing for college coursework and examinations. Students can compare tutors by subject, teaching mode, proposed rate, qualifications, and schedule fit.","Intermediate students","Online / In-person where offered","Intermediate","Find Intermediate Tutors","intermediate"],
  ["A-Level Tutoring","Cambridge AS/A2 tutoring delivered by available tutors with relevant subject knowledge. Students should review qualifications, experience, availability, and PKR pricing before confirming a booking.","A-Level students","Online / In-person where offered","A-Level","Find A-Level Tutors","a-level"],
  ["University Tutoring","Subject-based educational tutoring and academic-support services for legitimate learning support. TUTORERA does not advertise prohibited academic cheating, assignment impersonation, or exam misconduct.","University students","Online / In-person where offered","University","Find University Tutors","university"],
  ["Test Preparation","Preparation support for available exams such as MDCAT, ECAT, NTS, SAT, IELTS, and other supported examinations. Tutors may help with concepts, practice plans, and exam strategy where offered.","Exam candidates","Online / In-person where offered","Test preparation","Find Test Prep Tutors","test-preparation"],
  ["Language Tutoring","Language-learning support for available languages including English, Urdu, Arabic, and other languages offered by approved tutors. Lessons may cover speaking, writing, grammar, reading, and confidence building.","Language learners","Online / In-person where offered","All supported levels","Find Language Tutors","languages"],
  ["Computer Science & Technology Tutoring","Programming, computing concepts, digital skills, and related legitimate educational instruction. Services may include coding basics, web development concepts, computer science theory, and practical skills tutoring.","Technology learners","Online / In-person where offered","School to professional skills","Find Technology Tutors","computer-science"],
  ["Professional & Skills Tutoring","Skills tutoring where offered by approved tutors. Learners can compare tutor expertise, mode, availability, and final PKR rate before booking.","Adult and skills learners","Online / In-person where offered","Skills","Find Skills Tutors","skills"],
];

export default function ServicesPage() {
  return <main className={s.page}>
    <section className={s.hero}><h1>TUTORERA Tutoring Services</h1><p>TUTORERA is a service marketplace. Tutoring categories and tutor services are the products/services customers browse, compare, book, and pay for in PKR.</p></section>
    <section className={s.container}><div className={s.serviceGrid}>{services.map(([title, desc, learner, mode, level, cta, slug]) => <article key={title} className={s.serviceCard}>
      <div className={s.serviceImage} role="img" aria-label={`${title} professional education illustration`}>{title.split(" ")[0]}</div>
      <div className={s.serviceBody}><h2>{title}</h2><p>{desc}</p><div className={s.meta}><span><strong>Intended learner:</strong> {learner}</span><span><strong>Mode:</strong> {mode}</span><span><strong>Academic level:</strong> {level}</span><span><strong>Tutor-selection method:</strong> Browse tutors or post a requirement to receive offers.</span><span><strong>Pricing:</strong> Rates vary by tutor. Final agreed rate is shown in PKR before booking. Example rates may start from {formatPKR(1500, "hour")} where available.</span><span><strong>Availability:</strong> Subject to approved tutor inventory and schedule fit.</span></div><Link className={s.cta} href={`/tutors/level/${slug}`}>{cta}</Link></div>
    </article>)}</div></section>
  </main>;
}
