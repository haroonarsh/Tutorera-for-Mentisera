"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import api from "@/lib/axios";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

interface TutorVerification {
  _id: string;
  user: { name: string; email: string; phone: string; city: string; };
  bio: string;
  subjects: string[];
  levels: string[];
  city: string;
  hourlyRate: number;
  experience: number;
  verificationStatus: string;
  verificationDocs: { cnic?: string; degree?: string; videoIntro?: string; };
  createdAt: string;
}

export default function VerificationsPage() {
  const [tutors, setTutors] = useState<TutorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<TutorVerification | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const fetchTutors = async () => {
    try {
      const res = await api.get("/admin/verifications");
      setTutors(res.data.tutors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTutors(); }, []);

  const handleVerify = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/verify/${id}`, { status });
      setTutors(prev => prev.filter(t => t._id !== id));
      setSelected(null);
      alert(`Tutor ${status} successfully!`);
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#fffbeb', color: '#d97706' },
    approved: { bg: '#f0fdf4', color: '#16a34a' },
    rejected: { bg: '#fef2f2', color: '#ef4444' },
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Tutor Verifications</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Review and approve tutor applications.</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(["pending", "approved", "rejected"] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize', backgroundColor: filter === tab ? C.primary : 'white', color: filter === tab ? 'white' : C.gray500, border: filter === tab ? 'none' : '1px solid #e5e7eb' }}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ width: '36px', height: '36px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : tutors.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '4rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <Clock size={40} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: C.gray500, fontWeight: '600' }}>No pending verifications</p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>All tutor applications have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tutors.map(tutor => (
            <div key={tutor._id} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {/* Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                    {tutor.user?.name?.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem' }}>{tutor.user?.name}</p>
                    <p style={{ color: C.gray500, fontSize: '0.8rem' }}>{tutor.user?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {tutor.subjects?.slice(0, 3).map(s => (
                    <span key={s} style={{ backgroundColor: '#eff6ff', color: C.accent, fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '500' }}>{s}</span>
                  ))}
                  {tutor.city && <span style={{ backgroundColor: C.gray50, color: C.gray500, fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{tutor.city}</span>}
                </div>
              </div>

              {/* Status + Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: statusColors[tutor.verificationStatus]?.bg, color: statusColors[tutor.verificationStatus]?.color, textTransform: 'capitalize' }}>
                  {tutor.verificationStatus}
                </span>
                <button onClick={() => setSelected(selected?._id === tutor._id ? null : tutor)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: C.primary }}>
                  <Eye size={14} /> View
                </button>
                {tutor.verificationStatus === "pending" && (
                  <>
                    <button onClick={() => handleVerify(tutor._id, "approved")} disabled={actionLoading === tutor._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => handleVerify(tutor._id, "rejected")} disabled={actionLoading === tutor._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                )}
              </div>

              {/* Expanded Detail */}
              {selected?._id === tutor._id && (
                <div style={{ width: '100%', borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</p>
                    <p style={{ fontSize: '0.875rem', color: C.primary }}><strong>Phone:</strong> {tutor.user?.phone || "N/A"}</p>
                    <p style={{ fontSize: '0.875rem', color: C.primary }}><strong>Rate:</strong> Rs. {tutor.hourlyRate?.toLocaleString()}/hr</p>
                    <p style={{ fontSize: '0.875rem', color: C.primary }}><strong>Experience:</strong> {tutor.experience} years</p>
                    <p style={{ fontSize: '0.875rem', color: C.primary }}><strong>Applied:</strong> {new Date(tutor.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</p>
                    <p style={{ fontSize: '0.875rem', color: C.gray500, lineHeight: '1.6' }}>{tutor.bio || "No bio provided"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {tutor.verificationDocs?.cnic ? (
                        <a href={tutor.verificationDocs.cnic} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: C.accent, fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                          📄 View CNIC
                        </a>
                      ) : <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>❌ CNIC not uploaded</p>}
                      {tutor.verificationDocs?.degree ? (
                        <a href={tutor.verificationDocs.degree} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: C.accent, fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                          📄 View Degree
                        </a>
                      ) : <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>❌ Degree not uploaded</p>}
                      {tutor.verificationDocs?.videoIntro ? (
                        <a href={tutor.verificationDocs.videoIntro} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: C.accent, fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                          🎥 View Video Intro
                        </a>
                      ) : <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>❌ Video not uploaded</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}