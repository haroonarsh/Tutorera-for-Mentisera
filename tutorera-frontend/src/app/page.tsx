"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Search, Shield, MapPin, BookOpen, Users, Star, CheckCircle, XCircle } from "lucide-react";
import TopTutorsSection from "@/components/TopTutorsSection";

const C = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#2563eb',
  accentLight: '#eff6ff',
  accentDark: '#1d4ed8',
  highlight: '#3b82f6',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
};

export default function Home() {
  return (
    <div style={{ backgroundColor: 'white', color: C.primary }}>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: 'white', padding: '5rem 1.5rem 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: '800', color: C.primary, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Find the Right Tutor. Learn with Confidence.
          </h1>
          <p style={{ fontSize: '1.15rem', fontWeight: '600', color: C.accent, marginBottom: '1.25rem', letterSpacing: '0.01em' }}>
            TUTORS. Trusted. Transparent.
          </p>
          <p style={{ fontSize: '1rem', color: C.gray500, maxWidth: '640px', margin: '0 auto 0.75rem', lineHeight: '1.75' }}>
            Pakistan's modern tutoring marketplace where parents and students{" "}
            <strong style={{ color: C.primary }}>search, compare, and book tutors</strong>{" "}
            for one-to-one learning—by subject, level, budget, and schedule.
          </p>
          <p style={{ color: C.gray400, marginBottom: '2.5rem', fontSize: '0.9rem' }}>No agents. No guesswork.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tutors" style={{ backgroundColor: C.accent, color: 'white', padding: '0.85rem 2rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '1rem', textDecoration: 'none', display: 'inline-block' }}>
              Find a Tutor
            </Link>
            <Link href="/become-a-tutor" style={{ backgroundColor: 'white', color: C.primary, border: `1.5px solid #d1d5db`, padding: '0.85rem 2rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '1rem', textDecoration: 'none', display: 'inline-block' }}>
              Become a Tutor
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY TUTORERA ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>Why TUTORERA®?</h2>
            <p style={{ color: C.gray500, fontSize: '1.05rem' }}>Because choosing a tutor shouldn't feel risky.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <Search size={28} color={C.accent} />, title: "Search with Clarity", desc: "Search by subject, class, budget & timing." },
              { icon: <BookOpen size={28} color={C.accent} />, title: "Personalized Learning", desc: "One-to-one sessions tailored to your child's needs." },
              { icon: <Shield size={28} color={C.accent} />, title: "Clear & Safe Experience", desc: "A secure, monitored platform designed for parents who want clarity." },
              { icon: <MapPin size={28} color={C.accent} />, title: "Built for Pakistan", desc: "Designed for Pakistan's education systems and curricula." },
            ].map((item) => (
              <div key={item.title} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: C.gray400, marginTop: '2rem', fontSize: '0.875rem' }}>
            TUTORERA® replaces informal tuition with a clear, modern marketplace.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>
            Book the Best Tutors at your convenience.
          </h2>
          <p style={{ color: C.gray500, marginBottom: '3.5rem', fontSize: '1rem' }}>Simple. Clear. Reliable.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
            {[
              { step: "1", title: "Search", desc: "Tell us what you need—subject, level, schedule, budget." },
              { step: "2", title: "Compare", desc: "Review tutor profiles and choose what fits best." },
              { step: "3", title: "Learn", desc: "Book one-to-one sessions and start learning." },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: C.primary, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800' }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary }}>{item.title}</h3>
                <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHO ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, textAlign: 'center', marginBottom: '3rem' }}>
            Built for the Entire Learning Community
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <BookOpen size={26} color={C.accent} />, title: "For Students", items: ["Matric / FSc / ICS", "O-Level & A-Level", "Entry Tests", "Languages & Skills"] },
              { icon: <Users size={26} color={C.accent} />, title: "For Parents", items: ["Who want trusted tutors", "Who want clarity & structure", "Who want peace of mind"] },
              { icon: <Star size={26} color={C.accent} />, title: "For Tutors", items: ["Who want serious students", "Who want flexible schedules", "Who want a professional platform"] },
            ].map((card) => (
              <div key={card.title} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: '1rem' }}>{card.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '1.25rem' }}>{card.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {card.items.map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.gray500, fontSize: '0.875rem' }}>
                      <CheckCircle size={15} color={C.accent} style={{ flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, textAlign: 'center', marginBottom: '3rem' }}>
            A Smarter Model for Tutoring
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Traditional */}
            <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '0.875rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.gray400, marginBottom: '1.5rem' }}>Traditional Tuition</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {["Agents & references", "Informal arrangements", "Unclear expectations"].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.gray400, fontSize: '0.875rem' }}>
                    <XCircle size={17} color="#d1d5db" style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* TUTORERA */}
            <div style={{ border: `1.5px solid ${C.accent}`, backgroundColor: C.accentLight, borderRadius: '0.875rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '1.5rem' }}>TUTORERA®</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {["Marketplace choice", "Structured flow", "Transparent decisions"].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.primary, fontSize: '0.875rem', fontWeight: '500' }}>
                    <CheckCircle size={17} color={C.accent} style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p style={{ textAlign: 'center', color: C.gray400, marginTop: '2rem', fontSize: '0.875rem', fontStyle: 'italic' }}>
            This is tutoring—rebuilt for today.
          </p>
        </div>
      </section>

      {/* ── TOP TUTORS ── */}
      <TopTutorsSection />

      {/* ── BLOG ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>Insights From Our Blog</h2>
            <p style={{ color: C.gray500 }}>Expert advice for parents, students, and educators in Pakistan.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: "How to Find a Trusted Tutor in Pakistan", desc: "Feeling overwhelmed finding a tutor? This guide breaks down the process into simple, safe steps.", slug: "how-to-find-a-trusted-tutor-in-pakistan" },
              { title: "Online Tutoring vs. Traditional Home Tuition", desc: "Online tuition is exploding in Pakistan, but is it better than traditional home tuition?", slug: "online-vs-home-tuition-in-pakistan" },
              { title: "What Parents Should Look for Before Hiring a Tutor", desc: "Don't hire a tutor blindly. This checklist covers 5 critical areas every parent must consider.", slug: "what-to-look-for-before-hiring-a-tutor-pakistan" },
            ].map((post) => (
              <div key={post.slug} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ height: '160px', background: `linear-gradient(135deg, ${C.accent}, ${C.primary})` }} />
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '1rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>{post.title}</h3>
                  <p style={{ color: C.gray500, fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.6' }}>{post.desc}</p>
                  <Link href={`/blog/${post.slug}`} style={{ color: C.accent, fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none' }}>
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/blog" style={{ border: `1.5px solid ${C.primary}`, color: C.primary, padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
              Visit Our Blog
            </Link>
          </div>
        </div>
      </section>

      {/* ── BECOME TUTOR CTA ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.primary, color: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
            Teach Smarter with TUTORERA®
          </h2>
          <p style={{ color: C.gray400, marginBottom: '2rem', fontSize: '1rem' }}>Reach students across Pakistan without chasing leads.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            {["Teach on your schedule", "Focus on teaching, not marketing", "Work through a structured platform", "Build a professional tutoring presence"].map((item) => (
              <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: C.gray400, fontSize: '0.875rem' }}>
                <CheckCircle size={15} color={C.highlight} /> {item}
              </span>
            ))}
          </div>
          <Link href="/register?role=tutor" style={{ backgroundColor: C.accent, color: 'white', padding: '0.9rem 2.5rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '1rem', textDecoration: 'none', display: 'inline-block' }}>
            Join as a Tutor
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.75rem' }}>
            Start Learning the Right Way
          </h2>
          <p style={{ color: C.gray500, marginBottom: '2.5rem' }}>The right tutor can change outcomes.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link href="/tutors" style={{ backgroundColor: C.accent, color: 'white', padding: '0.85rem 2rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
              Find a Tutor
            </Link>
            <Link href="/register?role=tutor" style={{ border: `1.5px solid ${C.primary}`, color: C.primary, padding: '0.85rem 2rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
              Become a Tutor
            </Link>
          </div>
          <div style={{ backgroundColor: C.gray50, borderRadius: '1rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Need a Tailored Solution?</h3>
            <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.5rem' }}>Our support team is available to guide you to the perfect tutor.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" style={{ backgroundColor: C.primary, color: 'white', padding: '0.7rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
                Contact Support
              </Link>
              <a href="https://wa.me/923348880859" style={{ backgroundColor: '#16a34a', color: 'white', padding: '0.7rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}