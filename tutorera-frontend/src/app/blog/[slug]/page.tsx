"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, User, ArrowLeft, Tag } from "lucide-react";
import api from "@/lib/axios";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb', accentLight: '#eff6ff' };

interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: { name: string; };
  tags: string[];
  createdAt: string;
}

// Static blog content fallback
const staticBlogs: Record<string, Blog> = {
  "how-to-find-a-trusted-tutor-in-pakistan": {
    _id: "1", slug: "how-to-find-a-trusted-tutor-in-pakistan",
    title: "How to Find a Trusted Tutor in Pakistan (A Parent's Complete Guide)",
    excerpt: "Feeling overwhelmed finding a tutor in Pakistan?",
    author: { name: "TUTORERA Team" }, tags: ["parents", "guide"],
    createdAt: new Date().toISOString(),
    content: `Finding the right tutor for your child can feel overwhelming, especially when you're relying on informal word-of-mouth recommendations. Here's a structured approach to finding a trusted tutor in Pakistan.

**Step 1: Define Your Requirements**
Before searching, be clear about what you need. What subject? Which level (Matric, O-Level, FSc)? How many hours per week? What's your budget per hour? Online or in-person?

**Step 2: Use a Verified Platform**
Instead of relying on agents or Facebook groups, use a verified tutoring marketplace like TUTORERA®. Tutors on verified platforms have submitted their credentials, which are reviewed before they can teach.

**Step 3: Check Tutor Profiles Carefully**
Look for: educational qualifications, teaching experience, student reviews and ratings, availability, and teaching mode.

**Step 4: Have a Trial Session**
Before committing, request a trial session. Most tutors on TUTORERA® are open to a first session so you can assess compatibility.

**Step 5: Set Clear Expectations**
Once you've chosen a tutor, set clear expectations about lesson plans, homework, and progress tracking.

TUTORERA® makes this entire process transparent, safe, and simple — designed specifically for Pakistani parents and students.`,
  },
  "online-vs-home-tuition-in-pakistan": {
    _id: "2", slug: "online-vs-home-tuition-in-pakistan",
    title: "Online Tutoring vs. Traditional Home Tuition in Pakistan: Which is Better?",
    excerpt: "Online tuition is exploding in Pakistan.",
    author: { name: "TUTORERA Team" }, tags: ["online", "comparison"],
    createdAt: new Date().toISOString(),
    content: `With internet access expanding across Pakistan, online tutoring has become a viable and often preferred alternative to traditional home tuition. Here's an honest comparison.

**Cost**
Online tutoring is generally 20–30% cheaper than in-person tuition because tutors save on travel time and can serve more students.

**Safety**
Online tutoring eliminates concerns about having a stranger in your home, making it a safer choice for many families, especially in conservative households.

**Effectiveness**
Research shows that one-to-one online tutoring is just as effective as in-person when the student has a reliable internet connection and a quiet environment.

**Flexibility**
Online tutoring wins here — sessions can happen from anywhere, scheduling is easier, and cancellations are less disruptive.

**Verdict**
For most Pakistani students, especially at Matric and above, online tutoring via a platform like TUTORERA® offers the best balance of quality, safety, and convenience.`,
  },
  "what-to-look-for-before-hiring-a-tutor-pakistan": {
    _id: "3", slug: "what-to-look-for-before-hiring-a-tutor-pakistan",
    title: "What Parents Should Look for Before Hiring a Tutor in Pakistan",
    excerpt: "Don't hire a tutor blindly.",
    author: { name: "TUTORERA Team" }, tags: ["parents", "checklist"],
    createdAt: new Date().toISOString(),
    content: `Hiring a tutor is a significant decision that affects your child's education and safety. Here are 5 critical areas every Pakistani parent must evaluate.

**1. Qualifications**
Always verify the tutor's educational background. A tutor teaching A-Level Physics should have at least a BSc in Physics. On TUTORERA®, tutors submit their degrees which are verified before approval.

**2. Experience**
How many years have they been teaching? Do they have experience with your child's specific curriculum (Cambridge, Aga Khan, Punjab Board)?

**3. Reviews and References**
Check what other parents and students say. Reviews on TUTORERA® are from verified bookings, so they reflect real experiences.

**4. Teaching Style**
Does the tutor explain concepts clearly? Are they patient? A quick trial session will tell you more than any interview.

**5. Safety and Background**
For in-person tutoring, always ensure sessions happen in a shared space. For online tutoring, use a platform that has a vetting process for tutors.

TUTORERA® addresses all five of these concerns through its structured verification and review system.`,
  },
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blogs/${slug}`)
      .then(res => setBlog(res.data.blog))
      .catch(() => {
        // Use static fallback
        const fallback = staticBlogs[slug as string];
        if (fallback) setBlog(fallback);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!blog) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: C.gray500 }}>Blog post not found.</p>
      <Link href="/blog" style={{ color: C.accent, textDecoration: 'none', fontWeight: '600' }}>← Back to Blog</Link>
    </div>
  );

  return (
    <div style={{ backgroundColor: C.gray50, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: C.primary, padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            <ArrowLeft size={16} /> Back to Blog
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {blog.tags?.map(tag => (
              <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                <Tag size={11} />{tag}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)', fontWeight: '800', color: 'white', lineHeight: '1.3', marginBottom: '1.5rem' }}>
            {blog.title}
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={14} />{blog.author?.name}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} />{new Date(blog.createdAt).toLocaleDateString("en-PK", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '2.5rem', border: '1px solid #e5e7eb' }}>
          {blog.content.split('\n\n').map((para, i) => {
            if (para.startsWith('**') && para.endsWith('**')) {
              return <h3 key={i} style={{ fontSize: '1.15rem', fontWeight: '700', color: C.primary, margin: '1.75rem 0 0.75rem' }}>{para.replace(/\*\*/g, '')}</h3>;
            }
            if (para.includes('**')) {
              const parts = para.split('**');
              return (
                <p key={i} style={{ color: C.gray500, lineHeight: '1.8', marginBottom: '1rem', fontSize: '0.975rem' }}>
                  {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.primary }}>{part}</strong> : part)}
                </p>
              );
            }
            return <p key={i} style={{ color: C.gray500, lineHeight: '1.8', marginBottom: '1rem', fontSize: '0.975rem' }}>{para}</p>;
          })}
        </div>

        {/* CTA */}
        <div style={{ backgroundColor: C.primary, borderRadius: '0.875rem', padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Ready to Find Your Tutor?</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Join thousands of students learning with TUTORERA®</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tutors" style={{ backgroundColor: C.accent, color: 'white', padding: '0.75rem 1.75rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>Find a Tutor</Link>
            <Link href="/register" style={{ border: '1.5px solid white', color: 'white', padding: '0.75rem 1.75rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>Sign Up Free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}