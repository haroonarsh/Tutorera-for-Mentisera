"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, BookOpen, Clock } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

const C = {
  primary: '#1a1a2e',
  accent: '#2563eb',
  gray500: '#6b7280',
  gray50: '#f9fafb',
  accentLight: '#eff6ff',
};

interface RequestPreview {
  _id: string;
  subject: string;
  level: string;
  budget: number;
  teachingMode: string;
  city?: string;
  schedule: string;
  student: { name: string; city?: string };
}

export default function TopRequestsSection() {
  const [requests, setRequests] = useState<RequestPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    api.get("/requests/public/preview")
      .then(res => setRequests(res.data.requests))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && requests.length === 0) return null;

  const handleSeeAll = () => {
    router.push("/browse-requests");
  };

  return (
    <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>
            Students Are Looking for Tutors Right Now
          </h2>
          <p style={{ color: C.gray500 }}>
            A glimpse of live tuition requests waiting for the right tutor.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb', animation: 'pulse 1.5s infinite', height: '180px' }} />
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {requests.map(r => (
              <div key={r._id} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: C.primary, marginBottom: '0.3rem' }}>{r.subject}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: C.accent, backgroundColor: C.accentLight, padding: '0.15rem 0.6rem', borderRadius: '999px' }}>{r.level}</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', color: C.primary }}>Rs. {r.budget?.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: C.gray500 }}>
                  {r.city && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={13} />{r.city}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BookOpen size={13} />{r.teachingMode}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} />{r.schedule}</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: C.gray500, marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                  Posted by {r.student?.name}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <button onClick={handleSeeAll}
            style={{ border: `1.5px solid ${C.primary}`, color: C.primary, backgroundColor: 'transparent', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.primary; }}>
            See All Requests & Start Bidding
          </button>
        </div>
      </div>
    </section>
  );
}