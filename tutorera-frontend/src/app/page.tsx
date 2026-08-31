import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle,
  Clock,
  HandCoins,
  MessageSquare,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import TopTutorsSection from "@/components/TopTutorsSection";
import TopRequestsSection from "@/components/TopRequestsSection";
import type { Metadata } from "next";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Find Tutors in Pakistan | Student-Led Tutor Offers | TUTORERA®",
  description:
    "Post a tuition request, set your preferred rate, receive tutor offers, compare verified profiles, negotiate safely, and book tutors across Pakistan.",
  alternates: { canonical: "/" },
};

const trustStats = [
  { value: "0%", label: "student marketplace fee" },
  { value: "24h", label: "standard offer expiry" },
  { value: "100pt", label: "transparent match score" },
];

const marketplaceSteps = [
  { icon: Search, title: "Post what you need", desc: "Share subject, class level, learning goals, location, schedule, mode, and your proposed rate." },
  { icon: HandCoins, title: "Tutors send offers", desc: "Tutors can accept your rate or submit a counter-offer when your request allows negotiation." },
  { icon: SlidersHorizontal, title: "Compare with context", desc: "Review rate, match score, verification, qualifications, reviews, experience, response rate, and availability." },
  { icon: ShieldCheck, title: "Accept and book", desc: "Choose the tutor and agreed rate, then continue through the structured booking and payment flow." },
];

const benefits = [
  { icon: Users, title: "For parents and students", desc: "Define your need, compare tutor offers side-by-side, and keep decisions documented." },
  { icon: BookOpen, title: "For serious tutors", desc: "Find real student demand, submit relevant offers, show verified strengths, and build a professional tutoring presence." },
  { icon: ShieldCheck, title: "For safer tuition", desc: "Marketplace actions, reporting, disputes, offer expiry, and audit history keep the process clearer for both sides." },
];

const comparisonRows = [
  ["Pricing", "Usually fixed by agent or tutor", "Student proposes rate; tutor accepts or counters"],
  ["Choice", "One or two informal referrals", "Multiple comparable tutor offers"],
  ["Trust", "Hard to verify claims", "Profiles, verification, reviews, and reporting"],
  ["Decision", "Phone calls and scattered messages", "Structured request, offer, negotiation, and booking flow"],
];

const popularJourneys = [
  { href: "/tutors", label: "Browse verified tutors", icon: Users },
  { href: "/dashboard?tab=requests", label: "Post a tuition request", icon: MessageSquare },
  { href: "/browse-requests", label: "Tutor: view open requests", icon: Clock },
  { href: "/how-tutor-offers-work", label: "Learn how offers work", icon: Sparkles },
];

const blogPosts = [
  { title: "How to Find a Trusted Tutor in Pakistan", desc: "A practical guide for parents who want structure, safety, and better tutor-fit decisions.", slug: "how-to-find-a-trusted-tutor-in-pakistan" },
  { title: "Online Tutoring vs. Home Tuition", desc: "Compare mode, cost, flexibility, and accountability before choosing your learning setup.", slug: "online-vs-home-tuition-in-pakistan" },
  { title: "What to Check Before Hiring a Tutor", desc: "A parent-friendly checklist for qualifications, communication, availability, and trial expectations.", slug: "what-to-look-for-before-hiring-a-tutor-pakistan" },
];

export default function Home() {
  return (
    <main className={s.page}>
      <section className={s.hero} aria-labelledby="home-hero-title">
        <div className={s.heroGlow} aria-hidden="true" />
        <div className={s.container}>
          <div className={s.heroGrid}>
            <div className={s.heroCopy}>
              <p className={s.eyebrow}>
                <BadgeCheck size={18} aria-hidden="true" />
                Pakistan&apos;s student-led tutoring marketplace
              </p>
              <h1 id="home-hero-title" className={s.heroTitle}>
                Post your learning need. Compare tutor offers. Book with confidence.
              </h1>
              <p className={s.heroText}>
                TUTORERA® helps students and parents move beyond guesswork: set a proposed rate, receive relevant tutor offers, compare transparent fit signals, negotiate when needed, and keep the booking journey structured.
              </p>
              <div className={s.heroActions} aria-label="Primary actions">
                <Link className={s.primaryCta} href="/dashboard?tab=requests">
                  Post a Tuition Request <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link className={s.secondaryCta} href="/tutors">Browse Tutors</Link>
              </div>
              <div className={s.trustRow} aria-label="Marketplace highlights">
                {trustStats.map((stat) => (
                  <div key={stat.label} className={s.trustPill}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={s.heroPanel} aria-label="Tutor offer comparison preview">
              <div className={s.panelHeader}>
                <span>Live request</span>
                <strong>Mathematics · O-Level</strong>
              </div>
              <div className={s.requestCard}>
                <div>
                  <p className={s.mutedLabel}>Student proposed rate</p>
                  <strong>PKR 1,500/hour</strong>
                </div>
                <span className={s.statusBadge}>Receiving offers</span>
              </div>
              <div className={s.offerStack}>
                {[
                  ["92% match", "Verified tutor", "PKR 1,500/hour"],
                  ["86% match", "8 years exp.", "PKR 1,800/hour"],
                  ["78% match", "Fast response", "PKR 1,300/hour"],
                ].map(([match, detail, price]) => (
                  <div key={detail} className={s.offerPreview}>
                    <div className={s.avatarDot} aria-hidden="true" />
                    <div>
                      <strong>{match}</strong>
                      <span>{detail}</span>
                    </div>
                    <em>{price}</em>
                  </div>
                ))}
              </div>
              <div className={s.panelFooter}>
                <CheckCircle size={17} aria-hidden="true" />
                Compare rate, verification, reviews, availability, and response speed.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={s.journeyBand} aria-labelledby="journey-title">
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <p className={s.eyebrow}>Two discovery paths</p>
            <h2 id="journey-title">Choose your route into the marketplace</h2>
            <p>Students can browse tutors or post a request. Tutors can browse real demand and send thoughtful offers.</p>
          </div>
          <div className={s.journeyGrid}>
            {popularJourneys.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} className={s.journeyCard} href={item.href}>
                  <Icon size={22} aria-hidden="true" />
                  <span>{item.label}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="how-title">
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <p className={s.eyebrow}>Updated business model</p>
            <h2 id="how-title">How tutor offers work</h2>
            <p>A clearer marketplace loop: student demand first, tutor offers second, transparent comparison before commitment.</p>
          </div>
          <div className={s.stepsGrid}>
            {marketplaceSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className={s.stepCard} style={{ "--delay": `${index * 55}ms` } as CSSProperties}>
                  <span className={s.stepNumber}>0{index + 1}</span>
                  <div className={s.iconBox}><Icon size={24} aria-hidden="true" /></div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={s.softSection} aria-labelledby="trust-title">
        <div className={s.container}>
          <div className={s.splitGrid}>
            <div>
              <p className={s.eyebrow}>Trust, fit, and fairness</p>
              <h2 id="trust-title">Designed for decisions parents can actually understand</h2>
              <p className={s.lead}>
                A low price alone is not a good tutor decision. TUTORERA® brings pricing, availability, reviews, verification, qualifications, teaching mode, and match score into one view.
              </p>
              <Link className={s.textLink} href="/how-tutor-offers-work">
                See the offer workflow <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={s.benefitGrid}>
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} className={s.benefitCard}>
                    <Icon size={24} aria-hidden="true" />
                    <h3>{benefit.title}</h3>
                    <p>{benefit.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="compare-title">
        <div className={s.containerNarrow}>
          <div className={s.sectionHeader}>
            <p className={s.eyebrow}>Why it feels different</p>
            <h2 id="compare-title">A smarter alternative to informal tuition hunting</h2>
          </div>
          <div className={s.comparisonTable} role="table" aria-label="Traditional tuition compared with TUTORERA">
            <div className={s.tableHead} role="row">
              <span role="columnheader">Area</span>
              <span role="columnheader">Traditional</span>
              <span role="columnheader">TUTORERA®</span>
            </div>
            {comparisonRows.map(([area, oldWay, tutoreraWay]) => (
              <div key={area} className={s.tableRow} role="row">
                <strong role="cell">{area}</strong>
                <span role="cell">{oldWay}</span>
                <span role="cell">{tutoreraWay}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TopTutorsSection />
      <TopRequestsSection />

      <section className={s.softSection} aria-labelledby="blog-title">
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <p className={s.eyebrow}>Expert guidance</p>
            <h2 id="blog-title">Helpful reading before you choose</h2>
            <p>Clear, practical guides for Pakistani parents, students, and tutors.</p>
          </div>
          <div className={s.blogGrid}>
            {blogPosts.map((post) => (
              <article key={post.slug} className={s.blogCard}>
                <div className={s.blogArt} aria-hidden="true"><Star size={28} /></div>
                <div className={s.blogBody}>
                  <h3>{post.title}</h3>
                  <p>{post.desc}</p>
                  <Link className={s.textLink} href={`/blog/${post.slug}`}>
                    Read guide <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={s.ctaSection} aria-labelledby="final-cta-title">
        <div className={s.container}>
          <div className={s.ctaCard}>
            <div>
              <p className={s.eyebrow}>Ready when you are</p>
              <h2 id="final-cta-title">Start with the need, not the noise.</h2>
              <p>Post a request in minutes, or browse tutors directly if you already know what you want.</p>
            </div>
            <div className={s.ctaActions}>
              <Link className={s.primaryCta} href="/dashboard?tab=requests">
                Post Request <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className={s.secondaryCtaDark} href="/register?role=tutor">Join as Tutor</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
