import BrandLogo from "@/components/BrandLogo";
import { SUPPORT_EMAIL } from "@/lib/site";
import { BookOpen,Mail } from "lucide-react";
import Link from "next/link";
import { FiFacebook } from "react-icons/fi";
import { RiTwitterLine } from "react-icons/ri";
import { SiInstagram } from "react-icons/si";
import { SlSocialLinkedin } from "react-icons/sl";
import s from "./Footer.module.css";

// Footer grouped by user intent (spec §51). Only real, shipped routes.
const footerColumns = [
  {
    title: "Students",
    links: [
      { label: "Post Requirement", href: "/post-tuition-request" },
      { label: "Home Tuition", href: "/pk/home-tuition" },
      { label: "Online Tuition", href: "/pk/online-tuition" },
      { label: "Find Tutors", href: "/tutors" },
      { label: "Subjects", href: "/subjects" },
      { label: "Safety", href: "/safety" },
    ],
  },
  {
    title: "Tutors",
    links: [
      { label: "Become a Tutor", href: "/become-a-tutor" },
      { label: "Tuition Opportunities", href: "/opportunities" },
      { label: "Tutor Guide", href: "/tutor/guidebook" },
      { label: "Verification", href: "/verification-policy" },
      { label: "Tutor Agreement", href: "/terms/tutors" },
    ],
  },
  {
    title: "TUTORERA",
    links: [
      { label: "About", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Research", href: "/research" },
      { label: "Tutoring Index", href: "/research/tutoring-index" },
      { label: "Guides", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Refund & Cancellation", href: "/refund-policy" },
      { label: "Community Standards", href: "/community-guidelines" },
      { label: "Safeguarding", href: "/child-safety" },
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
              TUTORERA is a student-first tutoring marketplace. Students and parents post their learning requirements and preferred budget; eligible tutors can respond with offers to compare before a tutor is chosen.
            </p>
            <div className={s.contactList} aria-label="Contact information">
              <a href={`mailto:${SUPPORT_EMAIL}`}><Mail size={16} aria-hidden="true" /> Email: {SUPPORT_EMAIL}</a>
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
          <p>TUTORERA is a student-first tutoring marketplace.</p>
          <p>© 2026 TUTORERA®. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
