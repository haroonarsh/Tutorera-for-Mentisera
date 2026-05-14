"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, BookOpen } from "lucide-react";

const COLORS = {
  primary: '#1a1a2e',
  highlight: '#e94560',
  accent: '#2563eb',
};

const subjectsMenu = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "Urdu", "Computer Science", "Economics",
  "View All Subjects",
];

const levelsMenu = [
  "Primary School", "Middle School", "Matriculation",
  "O-Levels", "Intermediate / FSc", "A-Levels",
  "University Level", "Test Preparation", "View All Levels",
];

const coverageMenu = [
  "Islamabad", "Rawalpindi", "Lahore", "Karachi",
  "Peshawar", "Quetta", "Online (Pakistan-wide)", "View All Cities",
];

type DropdownKey = "subjects" | "levels" | "coverage" | null;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [mobileExpanded, setMobileExpanded] = useState<DropdownKey>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleDropdown = (key: DropdownKey) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  const dropdowns: { key: DropdownKey; label: string; items: string[] }[] = [
    { key: "subjects", label: "Subjects", items: subjectsMenu },
    { key: "levels", label: "Levels", items: levelsMenu },
    { key: "coverage", label: "Coverage", items: coverageMenu },
  ];

  return (
    <nav ref={navRef} style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <BookOpen size={28} color={COLORS.accent} strokeWidth={2} />
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: COLORS.primary, letterSpacing: '-0.02em' }}>
              TUTORERA<span style={{ color: COLORS.highlight }}>®</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden-mobile">
            <Link href="/" style={{ padding: '0.5rem 0.75rem', color: COLORS.primary, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Home
            </Link>

            <Link href="/tutors" style={{ padding: '0.5rem 0.75rem', color: COLORS.primary, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Find a Tutor
            </Link>

            {/* Dropdowns */}
            {dropdowns.map(({ key, label, items }) => (
              <div key={key} style={{ position: 'relative' }}>
                <button
                  onClick={() => toggleDropdown(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', color: COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem', backgroundColor: activeDropdown === key ? '#f3f4f6' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={e => { if (activeDropdown !== key) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {label}
                  <ChevronDown size={15} style={{ transition: 'transform 0.2s', transform: activeDropdown === key ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {activeDropdown === key && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', minWidth: '200px', zIndex: 100, overflow: 'hidden' }}>
                    {items.map((item, idx) => (
                      <Link
                        key={item}
                        href={`/${key}`}
                        onClick={() => setActiveDropdown(null)}
                        style={{
                          display: 'block', padding: '0.6rem 1rem', fontSize: '0.875rem', textDecoration: 'none',
                          color: idx === items.length - 1 ? COLORS.highlight : COLORS.primary,
                          fontWeight: idx === items.length - 1 ? '600' : '400',
                          borderTop: idx === items.length - 1 ? '1px solid #e5e7eb' : 'none',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="hidden-mobile">
            <Link href="/login" style={{ padding: '0.5rem 1rem', color: COLORS.primary, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Log in
            </Link>
            <Link href="/register" 
              style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', borderRadius: '0.4rem' }}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')} >
              Sign Up
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.primary, display: 'none' }} className="show-mobile">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Link href="/" onClick={() => setIsOpen(false)} style={{ padding: '0.7rem 0', color: COLORS.primary, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', borderBottom: '1px solid #f3f4f6' }}>Home</Link>
          <Link href="/tutors" onClick={() => setIsOpen(false)} style={{ padding: '0.7rem 0', color: COLORS.primary, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', borderBottom: '1px solid #f3f4f6' }}>Find a Tutor</Link>

          {dropdowns.map(({ key, label, items }) => (
            <div key={key}>
              <button
                onClick={() => setMobileExpanded(mobileExpanded === key ? null : key)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', color: COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500', borderBottom: '1px solid #f3f4f6' }}
              >
                {label}
                <ChevronDown size={15} style={{ transform: mobileExpanded === key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              {mobileExpanded === key && (
                <div style={{ paddingLeft: '1rem', paddingBottom: '0.5rem' }}>
                  {items.map((item) => (
                    <Link key={item} href={`/${key}`} onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '0.4rem 0', color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
                      {item}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem' }}>
            <Link href="/login" onClick={() => setIsOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '0.7rem', border: `1px solid ${COLORS.primary}`, color: COLORS.primary, textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Log in</Link>
            <Link href="/register" onClick={() => setIsOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '0.7rem', backgroundColor: COLORS.accent, color: 'white', textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Sign Up</Link>
          </div>
        </div>
      )}

      {/* CSS for show/hide */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}