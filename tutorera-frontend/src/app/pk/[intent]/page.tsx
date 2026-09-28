import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const PAGES: Record<string, { title: string; description: string; question: string; answer: string; mode: "home" | "online" | "both" }> = {
  "home-tuition": {
    title: "Home Tuition in Pakistan",
    description: "Post a home-tuition requirement in Pakistan, set a preferred budget, and compare offers from eligible tutors.",
    question: "How can I find home tuition in Pakistan?",
    answer: "Post your subject, curriculum, approximate area, schedule, and preferred budget. Eligible home-tuition tutors can submit offers, allowing you to compare options before choosing. Exact contact details and addresses stay private until a booking is confirmed.",
    mode: "home",
  },
  "online-tuition": {
    title: "Online Tuition in Pakistan",
    description: "Post an online-tuition requirement in Pakistan, set your preferred budget, and compare eligible tutor offers.",
    question: "How can I find an online tutor in Pakistan?",
    answer: "Post your subject, curriculum, timezone, schedule, and preferred budget. Eligible tutors can send offers for you to compare before selecting who to learn with.",
    mode: "online",
  },
  "mathematics-tuition": { title: "Mathematics Tuition in Pakistan", description: "Find mathematics tuition by posting your learning needs and comparing eligible tutor offers.", question: "How do I find a mathematics tutor in Pakistan?", answer: "Post the mathematics topics, level, schedule, and preferred budget. Eligible tutors can submit offers so you can compare teaching fit, availability, and pricing before choosing.", mode: "both" },
  "physics-tuition": { title: "Physics Tuition in Pakistan", description: "Post a physics-tuition requirement and compare eligible tutor offers in Pakistan.", question: "How do I find a physics tutor in Pakistan?", answer: "Post your physics level, curriculum, learning goals, schedule, and preferred budget. Tutors whose profiles fit the requirement can submit offers for you to compare.", mode: "both" },
  "chemistry-tuition": { title: "Chemistry Tuition in Pakistan", description: "Post a chemistry-tuition requirement and compare eligible tutor offers in Pakistan.", question: "How do I find a chemistry tutor in Pakistan?", answer: "Post your chemistry level, curriculum, learning goals, schedule, and preferred budget. Eligible tutors can send offers and you decide which option fits.", mode: "both" },
  "biology-tuition": { title: "Biology Tuition in Pakistan", description: "Post a biology-tuition requirement and compare eligible tutor offers in Pakistan.", question: "How do I find a biology tutor in Pakistan?", answer: "Describe the biology level, curriculum, topics, schedule, and preferred budget. Eligible tutors can submit offers for you to compare before booking.", mode: "both" },
  "english-tuition": { title: "English Tuition in Pakistan", description: "Post an English-tuition requirement and compare eligible tutor offers in Pakistan.", question: "How do I find an English tutor in Pakistan?", answer: "Post your English learning goal, level, schedule, and preferred budget. Eligible tutors can submit offers, and you choose after comparing the options.", mode: "both" },
  "o-level-tuition": { title: "O Level Tuition in Pakistan", description: "Post an O Level tuition requirement and compare eligible tutor offers for home or online learning.", question: "How do I find an O Level tutor in Pakistan?", answer: "Post the O Level subject, board or curriculum, schedule, mode, and preferred budget. Eligible tutors can make offers that you can compare before selecting a tutor.", mode: "both" },
  "a-level-tuition": { title: "A Level Tuition in Pakistan", description: "Post an A Level tuition requirement and compare eligible tutor offers for home or online learning.", question: "How do I find an A Level tutor in Pakistan?", answer: "Post the A Level subject, board or curriculum, schedule, mode, and preferred budget. Eligible tutors can submit offers, so your family retains the final choice.", mode: "both" },
  "mdcat-tutoring": { title: "MDCAT Tutoring in Pakistan", description: "Post an MDCAT tutoring requirement and compare eligible tutor offers.", question: "How do I find an MDCAT tutor in Pakistan?", answer: "Post the MDCAT topics, preparation timeline, schedule, learning mode, and preferred budget. Eligible tutors can send offers for you to compare before choosing.", mode: "both" },
};

export function generateStaticParams() { return Object.keys(PAGES).map((intent) => ({ intent })); }

export async function generateMetadata({ params }: { params: Promise<{ intent: string }> }): Promise<Metadata> {
  const { intent } = await params;
  const page = PAGES[intent];
  if (!page) return {};
  const path = `/pk/${intent}`;
  return { title: page.title, description: page.description, alternates: { canonical: path } };
}

export default async function PakistanStudentIntentPage({ params }: { params: Promise<{ intent: string }> }) {
  const { intent } = await params;
  const page = PAGES[intent];
  if (!page) notFound();
  const requestHref = page.mode === "home" ? "/post-home-tuition-request" : page.mode === "online" ? "/post-online-tuition-request" : "/post-tuition-request";
  const url = `https://tutorera.ac.pk/pk/${intent}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: page.title,
        description: page.description,
        url,
        isPartOf: { "@id": "https://tutorera.ac.pk/#website" },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://tutorera.ac.pk/" },
          { "@type": "ListItem", position: 2, name: "Pakistan", item: "https://tutorera.ac.pk/pk" },
          { "@type": "ListItem", position: 3, name: page.title, item: url },
        ],
      },
      // The page prints the same Q&A verbatim; FAQPage lets answer engines
      // (§40) surface it directly. Real page content, not fabricated.
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: page.question, acceptedAnswer: { "@type": "Answer", text: page.answer } },
        ],
      },
    ],
  };
  return <main style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.25rem 5rem", color: "#10224f" }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <nav aria-label="Breadcrumb" style={{ fontSize: ".9rem", marginBottom: "2rem" }}><Link href="/">Home</Link> / <Link href="/pk">Pakistan</Link> / {page.title}</nav>
    <p style={{ color: "#016EF8", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Student-first tutor matching</p>
    <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 1.1, margin: ".5rem 0 1rem" }}>{page.title}</h1>
    <p style={{ fontSize: "1.2rem", lineHeight: 1.65, maxWidth: 780 }}>{page.description}</p>
    <Link href={requestHref} style={{ display: "inline-block", margin: "1.5rem 0 3rem", padding: ".9rem 1.2rem", borderRadius: 10, background: "#0329B2", color: "#fff", fontWeight: 700, textDecoration: "none" }}>Post Tuition Requirement</Link>
    <section aria-labelledby="answer"><h2 id="answer">{page.question}</h2><p style={{ lineHeight: 1.7, maxWidth: 780 }}>{page.answer}</p></section>
    <section aria-labelledby="how" style={{ marginTop: "2.5rem" }}><h2 id="how">How TUTORERA works</h2><ol style={{ lineHeight: 1.9, maxWidth: 720 }}><li>Post the learning requirement and preferred budget.</li><li>Eligible tutors can submit offers where marketplace rules permit.</li><li>Compare tutor information, offer terms, and availability.</li><li>Choose a tutor and continue through the booking flow.</li></ol></section>
    <section aria-labelledby="next" style={{ marginTop: "2.5rem" }}><h2 id="next">Explore more</h2><p><Link href="/how-it-works">How TUTORERA works</Link> · <Link href="/safety">Safety and verification</Link> · <Link href="/tutors">Browse tutors</Link></p></section>
  </main>;
}
