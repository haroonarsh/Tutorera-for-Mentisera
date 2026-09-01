import Link from "next/link";
import { BookOpen, Mail, MapPin, ShieldCheck } from "lucide-react";
import { FiFacebook } from "react-icons/fi";
import { RiTwitterLine } from "react-icons/ri";
import { SiInstagram } from "react-icons/si";
import { SlSocialLinkedin } from "react-icons/sl";
import s from "./Footer.module.css";
import { BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";

const footerColumns = [
  {
    title: "Marketplace",
    links: [
      { label: "Find tutors", href: "/tutors" },
      { label: "Post a tuition request", href: "/dashboard?tab=requests" },
      { label: "How tutor offers work", href: "/how-tutor-offers-work" },
      { label: "Student Journey", href: "/student-journey" },
      { label: "Business Model", href: "/business-model" },
      { label: "Services", href: "/services" },
      { label: "Browse open requests", href: "/browse-requests" },
      { label: "Pricing", href: "/pricing" },
      { label: "How Payments Work", href: "/payment-process" },
      { label: "Payment Gateway Information", href: "/payment-gateway-information" },
    ],
  },
  {
    title: "Students & parents",
    links: [
      { label: "Tutors by city", href: "/locations" },
      { label: "Subjects", href: "/subjects" },
      { label: "Levels", href: "/levels" },
      { label: "Parent guide", href: "/help/for-parents" },
      { label: "First-session guarantee", href: "/first-session-guarantee" },
    ],
  },
  {
    title: "Tutors",
    links: [
      { label: "Become a tutor", href: "/become-a-tutor" },
      { label: "Tutor guide", href: "/help/for-tutors" },
      { label: "Earnings", href: "/earnings" },
      { label: "Verification standards", href: "/tutor-verification-standards" },
      { label: "Tutor screening policy", href: "/tutor-screening-policy" },
    ],
  },
  {
    title: "Trust & safety",
    links: [
      { label: "Safety policy", href: "/safety-policy" },
      { label: "Review policy", href: "/review-policy" },
      { label: "Complaint process", href: "/complaint-process" },
      { label: "Refund policy", href: "/refund-policy" },
      { label: "Cancellation policy", href: "/cancellation-policy" },
      { label: "Academic standards", href: "/academic-standards" },
    ],
  },
  {
    title: "Company & research",
    links: [
      { label: "About", href: "/about" },
      { label: "Coverage", href: "/coverage" },
      { label: "Blog", href: "/blog" },
      { label: "Tutoring rates research", href: "/research/pakistan-tutoring-rates" },
      { label: "Research methodology", href: "/research-methodology" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Editorial policy", href: "/editorial-policy" },
      { label: "Content review policy", href: "/content-review-policy" },
      { label: "Governance", href: "/governance" },
    ],
  },
];

const socialLinks = [
  { label: "Twitter / X", icon: RiTwitterLine, href: "https://twitter.com/mentiserapk" },
  { label: "Facebook", icon: FiFacebook, href: "https://facebook.com/mentiserapk" },
  { label: "Instagram", icon: SiInstagram, href: "https://instagram.com/mentiserapk" },
  { label: "LinkedIn", icon: SlSocialLinkedin, href: "https://linkedin.com/company/mentiserapk" },
];

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.top}>
          <div className={s.brand}>
            <Link href="/" className={s.logo} aria-label="TUTORERA home">
              <BookOpen size={26} aria-hidden="true" />
              <span>TUTORERA<em>®</em></span>
            </Link>
            <p>
              TUTORERA by MENTISERA is Pakistan&apos;s structured tutoring marketplace for student-led requests, transparent tutor offers, safer comparison, and documented bookings.
            </p>
            <div className={s.contactList} aria-label="Contact information">
              <strong>{LEGAL_OPERATOR}</strong>
              <span><MapPin size={16} aria-hidden="true" /> {BUSINESS_ADDRESS}</span>
              <a href={`mailto:${SUPPORT_EMAIL}`}><Mail size={16} aria-hidden="true" /> Email: {SUPPORT_EMAIL}</a>
              <a href="https://wa.me/923348880859"><ShieldCheck size={16} aria-hidden="true" /> Phone / WhatsApp: {SUPPORT_PHONE}</a>
              <Link href="/contact"><Mail size={16} aria-hidden="true" /> Contact support</Link>
              <Link href="/safety-policy"><ShieldCheck size={16} aria-hidden="true" /> Safety and trust center</Link>
            </div>
            <div className={s.socials} aria-label="Social links">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                    <Icon size={18} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          <nav className={s.columns} aria-label="Footer navigation">
            {footerColumns.map((column) => (
              <section key={column.title} aria-labelledby={`footer-${column.title.replace(/\s|&/g, "-").toLowerCase()}`}>
                <h2 id={`footer-${column.title.replace(/\s|&/g, "-").toLowerCase()}`}>{column.title}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </div>

        <div className={s.bottom}>
          <p>
            TUTORERA by MENTISERA is operated by{" "}
            <a href="https://www.mentisera.pk" target="_blank" rel="noopener noreferrer">
              {LEGAL_OPERATOR}
            </a>
            .
          </p>
          <p>© 2026 TUTORERA® Pakistan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
