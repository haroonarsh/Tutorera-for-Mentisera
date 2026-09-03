"use client";
import { UI_COLORS } from "@/lib/brand";
import { useState, useEffect } from "react";
import Link from "next/link";

const C = UI_COLORS;

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay so it doesn't flash immediately
      setTimeout(() => setShow(true), 1500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '1.5rem',
      right: '5rem', // leave space for WhatsApp button
      maxWidth: '480px',
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '1.25rem 1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      border: '1px solid #e5e7eb',
      zIndex: 998,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Cookie Icon + Text */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🍪</span>
        <div>
          <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
            We use cookies
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', lineHeight: '1.5' }}>
            We use cookies to improve your experience, analyse traffic, and personalise content.
            By clicking "Accept", you agree to our{" "}
            <Link href="/privacy" style={{ color: C.accent, textDecoration: 'none', fontWeight: '600' }}>
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" style={{ color: C.accent, textDecoration: 'none', fontWeight: '600' }}>
              Terms of Service
            </Link>.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={handleDecline}
          style={{
            flex: 1, padding: '0.6rem', border: '1.5px solid #e5e7eb',
            borderRadius: '0.5rem', background: 'white', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: '600', color: '#6b7280',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F7FF')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
          Decline
        </button>
        <button
          onClick={handleAccept}
          style={{
            flex: 2, padding: '0.6rem', border: 'none',
            borderRadius: '0.5rem', backgroundColor: C.accent,
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', color: 'white',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.accent)}>
          Accept All Cookies
        </button>
      </div>
    </div>
  );
}