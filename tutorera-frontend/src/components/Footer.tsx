/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BookOpen, Mail, MapPin, ShieldCheck } from "lucide-react";
import { FiFacebook } from "react-icons/fi";
import { RiTwitterLine } from "react-icons/ri";
import { SiInstagram } from "react-icons/si";
import { SlSocialLinkedin } from "react-icons/sl";
import s from "./Footer.module.css";
import { BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import BrandLogo from "@/components/BrandLogo";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About TUTORERA", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Business Model", href: "/business-model" },
      { label: "Pricing & 0% Student Fee", href: "/pricing" },
      { label: "Ownership & Governance", href: "/governance" },
      { label: "Contact & Support", href: "/contact" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { label: "Find a Tutor", href: "/tutors" },
      { label: "Post Tuition Requirement", href: "/dashboard?tab=requests" },
      { label: "Online Tutoring Terms", href: "/terms/online-tutoring" },
      { label: "Home Tuition Terms", href: "/terms/home-tuition" },
      { label: "Tutor Agreement", href: "/terms/tutors" },
      { label: "Student & Parent Terms", href: "/terms/students" },
    ],
  },
  {
    title: "Trust & Safety",
    links: [
      { label: "Trust & Safety Center", href: "/safety" },
      { label: "Child Safeguarding", href: "/child-safety" },
      { label: "Tutor Verification Standards", href: "/verification-policy" },
      { label: "Background Check Policy", href: "/background-check-policy" },
      { label: "Academic Integrity Code", href: "/academic-integrity" },
      { label: "Dispute & Complaint Process", href: "/complaint-process" },
    ],
  },
  {
    title: "Legal & Privacy",
    links: [
      { label: "Global Legal Center", href: "/legal" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Subprocessors Directory", href: "/legal/subprocessors" },
      { label: "AI & Algorithm Transparency", href: "/legal/ai-transparency" },
      { label: "Privacy Rights & Data Export", href: "/privacy-center" },
      { label: "Delete Account", href: "/account/delete" },
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
            <BrandLogo className={s.logo} imageClassName={s.logoImage} variant="light" size="lg" />
            <p>
              TUTORERA® by MENTISERA is a global student-led tutoring marketplace connecting students and parents with qualified tutors for online sessions worldwide and verified in-person home tuition locally.
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
