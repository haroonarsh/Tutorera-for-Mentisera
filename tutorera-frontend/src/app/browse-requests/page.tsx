"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { MapPin, BookOpen, Clock, Send } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const C = {
  primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb',
  accentLight: '#eff6ff', error: '#ef4444', success: '#16a34a',
};

interface RequestItem {
  _id: string;
  subject: string;
  level: string;
  description: string;
  budget: number;
  teachingMode: string;
  city?: string;
  schedule: string;
  createdAt: string;
  student: { name: string; city?: string; avatar?: string };
}

const LEVELS = ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"];

export default function BrowseRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bidModalRequest, setBidModalRequest] = useState<RequestItem | null>(null);

  const fetchRequests = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(pageNum), limit: "12" };
      if (subject) params.subject = subject;
      if (level) params.level = level;
      if (city) params.city = city;
      const res = await api.get(`/requests?${new URLSearchParams(params).toString()}`);
      setRequests(res.data.requests);
      setTotalPages(Math.max(1, Math.ceil(res.data.total / 12)));
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, level, city]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchRequests(1); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, level, city]);

  useEffect(() => { fetchRequests(page); /* eslint-disable-next-line */ }, [page]);

  return (
    <div style={{ backgroundColor: C.gray50, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: C.primary, padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>
            Browse Student Requests
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
            Find relevant tuition requests and send students a transparent offer.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', backgroundColor: 'white', padding: '1.25rem', borderRadius: '0.875rem', border: '1px solid #e5e7eb' }}>
          <input
            type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Search by subject..."
            style={{ flex: '1 1 200px', padding: '0.65rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', color: C.primary }}
          />
          <select
            value={level} onChange={e => setLevel(e.target.value)}
            style={{ flex: '0 1 160px', padding: '0.65rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: level ? C.primary : C.gray500, backgroundColor: 'white' }}>
            <option value="">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input
            type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="City..."
            style={{ flex: '0 1 160px', padding: '0.65rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', color: C.primary }}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb', height: '180px' }}>
                <div style={{ width: '60%', height: '16px', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '1rem' }} />
                <div style={{ width: '100%', height: '12px', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '0.5rem' }} />
                <div style={{ width: '80%', height: '12px', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '4rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ color: C.gray500, fontSize: '1rem' }}>No open requests match your filters right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {requests.map(r => (
              <div key={r._id} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: C.primary, marginBottom: '0.2rem' }}>{r.subject}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: C.accent, backgroundColor: C.accentLight, padding: '0.15rem 0.6rem', borderRadius: '999px' }}>{r.level}</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: C.primary }}>Rs. {r.budget?.toLocaleString()}</span>
                </div>

                <p style={{ color: C.gray500, fontSize: '0.85rem', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {r.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: C.gray500 }}>
                  {r.city && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={13} />{r.city}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BookOpen size={13} />{r.teachingMode}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} />{r.schedule}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '0.8rem', color: C.gray500 }}>By {r.student?.name}</span>
                  <button onClick={() => setBidModalRequest(r)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: C.accent, color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Send size={13} /> Send Offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                style={{ width: '36px', height: '36px', borderRadius: '0.5rem', border: page === i + 1 ? 'none' : '1px solid #e5e7eb', backgroundColor: page === i + 1 ? C.accent : 'white', color: page === i + 1 ? 'white' : C.primary, fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {bidModalRequest && (
        <BidModal
          request={bidModalRequest}
          onClose={() => setBidModalRequest(null)}
          onSuccess={() => { setBidModalRequest(null); fetchRequests(page); }}
        />
      )}
    </div>
  );
}

function BidModal({ request, onClose, onSuccess }: { request: RequestItem; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(String(request.budget || ""));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useFocusTrap(true, onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(`/requests/${request._id}/bids`, { amount: Number(amount), message });
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to send offer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }} onClick={onClose} role="presentation">
      <div ref={modalRef} style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Send an offer">
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: C.primary, marginBottom: '0.3rem' }}>Send Tutor Offer</h3>
        <p style={{ color: C.gray500, fontSize: '0.85rem', marginBottom: '1.5rem' }}>{request.subject} · {request.level}</p>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: C.error, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Your Offer (PKR)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min={1}
              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Message to Student</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Briefly introduce yourself and your approach..."
              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: 'white', color: C.gray500, border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: loading ? '#93c5fd' : C.accent, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? "Sending..." : "Send Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
