/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BookOpen, Mail, MapPin, ShieldCheck } from "lucide-react";
import { FiFacebook } from "react-icons/fi";
import { RiTwitterLine } from "react-icons/ri";
import { SiInstagram } from "react-icons/si";
import { SlSocialLinkedin } from "react-icons/sl";
import s from "./Footer.module.css";
import { BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";

const footerColumns = [
  { title: "Company", links: [
    { label: "About", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Business Model", href: "/business-model" },
    { label: "Contact", href: "/contact" },
    { label: "Ownership & Governance", href: "/governance" },
    { label: "Team", href: "/team" },
  ] },
  { title: "Students", links: [
    { label: "Find a Tutor", href: "/tutors" },
    { label: "Post Tuition Requirement", href: "/dashboard?tab=requests" },
    { label: "Subjects", href: "/subjects" },
    { label: "Services", href: "/services" },
    { label: "Levels", href: "/levels" },
    { label: "Pricing", href: "/pricing" },
  ] },
  { title: "Payments", links: [
    { label: "How Payments Work", href: "/payment-process" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
  ] },
  { title: "Legal", links: [
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Home Tuition Terms", href: "/in-person-home-tuition-terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
    { label: "Complaint & Dispute Resolution", href: "/complaint-process" },
    { label: "Disclaimer", href: "/disclaimer" },
  ] },
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
              <img src="/tutorera-icon-192.png" alt="" width={54} height={54} className={s.logoImage} />
              <span>
                <strong>TUTORERA<em>®</em></strong>
                <small>by MENTISERA</small>
              </span>
            </Link>
            <p>
              TUTORERA® by MENTISERA is Pakistan&apos;s student-led digital tutoring marketplace connecting students and parents with qualified tutors for online and in-person educational support.
            </p>
            <div className={s.contactList} aria-label="Contact information">
              <a href={`mailto:${SUPPORT_EMAIL}`}><Mail size={16} aria-hidden="true" /> Email: {SUPPORT_EMAIL}</a>
              <a href="https://wa.me/923348880859"><ShieldCheck size={16} aria-hidden="true" /> Phone / WhatsApp: {SUPPORT_PHONE}</a>
              <span><MapPin size={16} aria-hidden="true" /> Business Address: {BUSINESS_ADDRESS}</span>
              <Link href="/"><BookOpen size={16} aria-hidden="true" /> Website: https://tutorera.ac.pk/</Link>
              <Link href="/contact"><Mail size={16} aria-hidden="true" /> Contact support</Link>
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
          <p>TUTORERA® is a digital tutoring marketplace operated by {LEGAL_OPERATOR}.</p>
          <p>© 2026 {LEGAL_OPERATOR}. TUTORERA®. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
