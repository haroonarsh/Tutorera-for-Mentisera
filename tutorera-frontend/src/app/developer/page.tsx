// src/app/developer/page.tsx
"use client";
import Image from "next/image";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

const skills = [
    "Next.js", "React", "TypeScript", "Node.js", "Express",
    "MongoDB", "Socket.io", "JWT & OAuth", "REST APIs",
    "Cloudinary", "Zod", "Cloudflare Workers",
    ];

    const experience = [
    {
        role: "Full-Stack Developer — Mentisera (SMC-Private) Limited",
        period: "Apr 2026 – Present",
        points: [
        "Designed and built TUTORERA® end-to-end — auth (incl. Google OAuth), real-time chat & notifications via Socket.io, the bidding/booking engine, and an admin panel with PDF/Excel reporting.",
        "Led remediation of a full third-party security audit: fixed authorization gaps in booking and bid flows, added rate limiting, made booking acceptance transaction-safe under concurrency, and added file-upload signature verification.",
        "Built a real automated test suite from scratch (Jest + MongoDB Memory Server) covering every high-risk flow the audit flagged, and hardened the API with structured logging, request tracing, and versioning.",
        "Migrated the frontend from Vercel to Cloudflare Workers and led the ongoing Rapid Gateway payment integration.",
        ],
    },
    {
        role: "Full-Stack Web Developer Intern — TechnoHacks Solutions (Remote)",
        period: "Sep 2025 – Oct 2025",
        points: [
        "Built full-stack apps with Next.js and Node.js/Express that loaded 30% faster, improving client user retention.",
        "Shipped secure auth (JWT, Passport.js, Google OAuth) tested with 500+ users.",
        "Added real-time chat and media features backed by MongoDB and Cloudinary.",
        ],
    },
    {
        role: "MERN Stack Developer — Ncode Inc (Islamabad)",
        period: "May 2025 – Aug 2025",
        points: [
        "Optimized Node.js APIs, cutting response times from 500ms to under 150ms.",
        "Migrated legacy code toward microservices, improving sprint speed ~20%.",
        ],
    },
    ];

    const projects = [
    { name: "TUTORERA®", desc: "Pakistan's tutoring marketplace — the platform you're using right now.", tag: "Production" },
    { name: "Messenger Clone", desc: "Real-time messaging app with group chats, voice/video calls, and media sharing (Next.js, Socket.io, MongoDB).", tag: "Personal Project" },
    { name: "Aladdin E-Commerce", desc: "Full online store with Google OAuth, cart, and admin dashboards.", tag: "Personal Project" },
    { name: "BandWagon", desc: "Event-mapping app using Google Maps API, deployed on Vercel.", tag: "Personal Project" },
    ];

    const links = [
    { label: "GitHub", href: "https://github.com/haroonarsh", icon: "🐙" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/haroon-arshad-web-developer", icon: "💼" },
    { label: "Email", href: "mailto:arshadharoon217@gmail.com", icon: "✉️" },
    { label: "Facebook", href: "https://www.facebook.com/share/1EdZ9yj8Jr/", icon: "📘" },
    ];

    export default function DeveloperPage() {
    return (
        <main style={{ backgroundColor: C.primary, minHeight: '100vh', color: 'white', overflow: 'hidden' }}>
        {/* ── Hero ── */}
        <section style={{ position: 'relative', padding: '5rem 1.5rem 6rem', textAlign: 'center' }}>
            <div className="orb orb1" />
            <div className="orb orb2" />
            <div className="orb orb3" />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '720px', margin: '0 auto' }}>
            <div className="avatarWrap">
                <Image
                src="/developer/haroon.jpeg"
                alt="Haroon Arshad"
                width={148}
                height={148}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.15)' }}
                priority
                />
            </div>

            <h1 className="gradientText" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900, margin: '1.5rem 0 0.5rem' }}>
                Haroon Arshad
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#93c5fd', fontWeight: 600, marginBottom: '1.5rem' }}>
                Full-Stack Developer
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 2rem' }}>
                I'm the developer behind TUTORERA® — I designed and built this platform end-to-end,
                from the booking engine and real-time chat to the security hardening and testing that
                keep it reliable. Final-year Engineering student, MERN-stack specialist, and someone who
                genuinely enjoys turning a rough idea into a product real people use.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {links.map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="linkChip">
                    <span>{l.icon}</span> {l.label}
                </a>
                ))}
            </div>
            </div>
        </section>

        {/* ── Skills ── */}
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>Tech I Work With</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
            {skills.map((s, i) => (
                <span key={s} className="skillPill" style={{ animationDelay: `${i * 0.05}s` }}>{s}</span>
            ))}
            </div>
        </section>

        {/* ── What I built on TUTORERA ── */}
        <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
            <div className="glassCard">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>🚀 What I Built Here</h2>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingLeft: '1.25rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                <li>The full booking &amp; bidding marketplace — auth, real-time chat, notifications, and the admin panel.</li>
                <li>A complete security remediation pass covering authorization, rate limiting, and safe concurrent bookings.</li>
                <li>An automated test suite built from scratch, covering every high-risk flow on the platform.</li>
                <li>Infrastructure: Cloudflare Workers migration, structured logging, API versioning, and the Rapid Gateway payment integration.</li>
            </ul>
            </div>
        </section>

        {/* ── Experience ── */}
        <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>Experience</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {experience.map(job => (
                <div key={job.role} className="glassCard">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job.role}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>{job.period}</span>
                </div>
                <ul style={{ paddingLeft: '1.1rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {job.points.map(p => <li key={p}>{p}</li>)}
                </ul>
                </div>
            ))}
            </div>
        </section>

        {/* ── Projects ── */}
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>Projects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {projects.map(p => (
                <div key={p.name} className="projectCard">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.tag}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.4rem 0 0.5rem' }}>{p.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{p.desc}</p>
                </div>
            ))}
            </div>
        </section>

        <style jsx>{`
            .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            opacity: 0.35;
            z-index: 1;
            animation: float 8s ease-in-out infinite;
            }
            .orb1 { width: 280px; height: 280px; background: #2563eb; top: -60px; left: -60px; }
            .orb2 { width: 220px; height: 220px; background: #7c3aed; top: 100px; right: -40px; animation-delay: 2s; }
            .orb3 { width: 180px; height: 180px; background: #16a34a; bottom: -60px; left: 40%; animation-delay: 4s; }

            @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-25px) scale(1.08); }
            }

            .avatarWrap {
            display: inline-block;
            animation: popIn 0.6s ease-out;
            }
            @keyframes popIn {
            0% { opacity: 0; transform: scale(0.8) translateY(10px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
            }

            .gradientText {
            background: linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: shimmer 4s linear infinite;
            }
            @keyframes shimmer {
            to { background-position: 200% center; }
            }

            .linkChip {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.55rem 1.1rem;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 999px;
            color: white;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 600;
            transition: transform 0.2s ease, background 0.2s ease;
            }
            .linkChip:hover {
            background: rgba(37,99,235,0.35);
            transform: translateY(-2px);
            }

            .skillPill {
            padding: 0.5rem 1rem;
            background: rgba(37,99,235,0.12);
            border: 1px solid rgba(37,99,235,0.35);
            border-radius: 999px;
            font-size: 0.82rem;
            font-weight: 600;
            color: #93c5fd;
            opacity: 0;
            animation: rise 0.5s ease forwards;
            }
            @keyframes rise {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
            }

            .glassCard {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.1);
            borderRadius: 1rem;
            border-radius: 1rem;
            padding: 1.5rem;
            backdrop-filter: blur(6px);
            }

            .projectCard {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 1rem;
            padding: 1.25rem;
            transition: transform 0.2s ease, border-color 0.2s ease;
            }
            .projectCard:hover {
            transform: translateY(-4px);
            border-color: rgba(37,99,235,0.5);
            }
        `}</style>
        </main>
    );
}