import Link from "next/link";
import { BookOpen  } from "lucide-react";
import { RiTwitterLine } from "react-icons/ri";
import { FiFacebook } from "react-icons/fi";
import { SiInstagram } from "react-icons/si";
import { SlSocialLinkedin } from "react-icons/sl";

const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  highlight: '#e94560',
  accent: '#2563eb',
};

export default function Footer() {
  return (
    <footer style={{ backgroundColor: COLORS.primary, color: 'white', paddingTop: '4rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Top Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BookOpen size={24} color={COLORS.accent} />
              <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                TUTORERA<span style={{ color: COLORS.highlight }}>®</span>
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              Pakistan's trusted digital tutoring platform. Connecting students with verified tutors for a safe and effective learning experience.
            </p>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { icon: <RiTwitterLine size={18} />, href: "https://twitter.com/mentiserapk" },
                { icon: <FiFacebook size={18} />, href: "https://facebook.com/mentiserapk" },
                { icon: <SiInstagram size={18} />, href: "https://instagram.com/mentiserapk" },
                { icon: <SlSocialLinkedin size={18} />, href: "https://linkedin.com/company/mentiserapk" },
              ].map(({ icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', textDecoration: 'none', transition: 'background 0.2s' }}
                  // onMouseEnter={e => (e.currentTarget.style.backgroundColor = COLORS.highlight)}
                  // onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                  >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1.2rem' }}>Company</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: "About TUTORERA®", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "How TUTORERA® Works", href: "/how-it-works" },
                { label: "Careers", href: "/careers" },
                { label: "Contact Us", href: "/contact" },
                { label: "Help Center", href: "/help" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}
                    // onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    // onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Students */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1.2rem' }}>For Students</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: "Find a Tutor", href: "/tutors" },
                { label: "Subjects", href: "/subjects" },
                { label: "Levels", href: "/levels" },
                { label: "Pricing", href: "/pricing" },
                { label: "Parent Guide", href: "/help/for-parents" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}
                    // onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    // onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Tutors */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1.2rem' }}>For Tutors</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: "Become a Tutor", href: "/become-a-tutor" },
                { label: "Tutor Guide", href: "/help/for-tutors" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}
                    // onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    // onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1.2rem' }}>Legal</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Disclaimer", href: "/disclaimer" },
                { label: "Safety Policy", href: "/safety-policy" },
                { label: "Complaint Process", href: "/complaint-process" },
                { label: "Cancellation Policy", href: "/cancellation-policy" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}
                    // onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    // onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.7' }}>
            TUTORERA® is operated by{" "}
            <a href="https://www.mentisera.pk" style={{ color: COLORS.accent, textDecoration: 'none' }}>
              MENTISERA (SMC-Private) Limited
            </a>
            , an education-focused organization committed to building transparent, platform-based learning solutions for Pakistan.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            © 2026 TUTORERA® Pakistan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}