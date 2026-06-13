"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, EyeOff, Clock, Download } from "lucide-react";
import api from "@/lib/axios";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

interface TutorProfile {
  _id: string;
  user: { _id: string; name: string; email: string; phone: string; city: string; createdAt: string; };
  fullName: string;
  phone: string;
  city: string;
  gender: string;
  dateOfBirth: string;
  bio: string;
  subjects: string[];
  levels: string[];
  hourlyRate: number;
  experience: number;
  education: { degree: string; institution: string; year: number; degreeDoc: string; }[];
  previousInstitutions: string[];
  teachingMode: string;
  cnicFront: string;
  cnicBack: string;
  videoIntro: string;
  policeCertificate: string;
  verificationStatus: string;
  rejectionReason: string;
  onboardingComplete: boolean;
  createdAt: string;
}

export default function VerificationsPage() {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/verifications?status=${filter}`);
      setTutors(res.data.tutors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTutors(); }, [filter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/verify/${id}`, { status: "approved" });
      setTutors(prev => prev.filter(t => t._id !== id));
      setExpanded(null);
    } catch {
      alert("Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { alert("Please provide a rejection reason."); return; }
    setActionLoading(id);
    try {
      await api.patch(`/admin/verify/${id}`, { status: "rejected", reason: rejectReason });
      setTutors(prev => prev.filter(t => t._id !== id));
      setRejectingId(null);
      setRejectReason("");
      setExpanded(null);
    } catch {
      alert("Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fffbeb', color: '#d97706' },
      approved: { bg: '#f0fdf4', color: '#16a34a' },
      rejected: { bg: '#fef2f2', color: '#ef4444' },
    };
    return (
      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: colors[status]?.bg, color: colors[status]?.color, textTransform: 'capitalize' }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Tutor Verifications</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Review full tutor applications and manage verification.</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {["pending", "approved", "rejected"].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: filter === tab ? 'none' : '1px solid #e5e7eb', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize', backgroundColor: filter === tab ? C.primary : 'white', color: filter === tab ? 'white' : C.gray500 }}>
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
          <p style={{ color: C.gray500, fontWeight: '600' }}>No {filter} verifications</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tutors.map(tutor => (
            <div key={tutor._id} style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>

              {/* Header Row */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
                    {(tutor.fullName || tutor.user?.name || "T").charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: C.primary, fontSize: '1rem' }}>{tutor.fullName || tutor.user?.name}</p>
                    <p style={{ color: C.gray500, fontSize: '0.8rem' }}>{tutor.user?.email}</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Applied: {new Date(tutor.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {statusBadge(tutor.verificationStatus)}
                  <button onClick={() => setExpanded(expanded === tutor._id ? null : tutor._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: C.primary }}>
                    {expanded === tutor._id ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> View Full Data</>}
                  </button>
                  {tutor.verificationStatus === "pending" && (
                    <>
                      <button onClick={() => handleApprove(tutor._id)} disabled={actionLoading === tutor._id}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => setRejectingId(rejectingId === tutor._id ? null : tutor._id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reject Reason Input */}
              {rejectingId === tutor._id && (
                <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fef2f2', borderTop: '1px solid #fecaca' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ef4444', marginBottom: '0.5rem' }}>Rejection Reason</p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Tell the tutor why they were rejected..."
                      style={{ flex: 1, padding: '0.6rem 1rem', border: '1px solid #fecaca', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }} />
                    <button onClick={() => handleReject(tutor._id)} disabled={actionLoading === tutor._id}
                      style={{ padding: '0.6rem 1.25rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded Full Data */}
              {expanded === tutor._id && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                    {/* Personal Info */}
                    <div style={{ backgroundColor: C.gray50, borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: C.primary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Personal Info</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { label: "Full Name", value: tutor.fullName || tutor.user?.name },
                          { label: "Email", value: tutor.user?.email },
                          { label: "Phone", value: tutor.phone || tutor.user?.phone },
                          { label: "City", value: tutor.city || tutor.user?.city },
                          { label: "Gender", value: tutor.gender },
                          { label: "Date of Birth", value: tutor.dateOfBirth },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.label}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: C.primary }}>{item.value || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div style={{ backgroundColor: C.gray50, borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: C.primary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎓 Education</h3>
                      {tutor.education?.length > 0 ? tutor.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: i < tutor.education.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: '700', color: C.primary }}>{edu.degree}</p>
                          <p style={{ fontSize: '0.8rem', color: C.gray500 }}>{edu.institution} — {edu.year}</p>
                          {edu.degreeDoc && (
                            <a href={edu.degreeDoc} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: C.accent, fontSize: '0.75rem', fontWeight: '600', textDecoration: 'none', marginTop: '0.3rem' }}>
                              <Download size={12} /> View Degree Certificate
                            </a>
                          )}
                        </div>
                      )) : <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No education data</p>}
                    </div>

                    {/* Teaching Info */}
                    <div style={{ backgroundColor: C.gray50, borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: C.primary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📚 Teaching Info</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Experience</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: C.primary }}>{tutor.experience} years</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Hourly Rate</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: C.primary }}>Rs. {tutor.hourlyRate?.toLocaleString()}/hr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Mode</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: C.primary, textTransform: 'capitalize' }}>{tutor.teachingMode}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Subjects</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {tutor.subjects?.map(s => <span key={s} style={{ backgroundColor: '#eff6ff', color: C.accent, fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{s}</span>)}
                        </div>
                      </div>
                      <div style={{ marginTop: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Levels</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {tutor.levels?.map(l => <span key={l} style={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{l}</span>)}
                        </div>
                      </div>
                    </div>

                    {/* Verification Documents */}
                    <div style={{ backgroundColor: C.gray50, borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: C.primary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔐 Verification Docs</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { label: "CNIC Front", url: tutor.cnicFront },
                          { label: "CNIC Back", url: tutor.cnicBack },
                          { label: "Video Intro", url: tutor.videoIntro },
                          {
                            label: "Police Certificate",
                            url: tutor.policeCertificate,
                            required: tutor.teachingMode === "in-person" || tutor.teachingMode === "both",
                          },
                        ].map(doc => (
                          <div key={doc.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                              {doc.label}
                              {"required" in doc && doc.required && (
                                <span style={{ color: '#ef4444', marginLeft: '3px', fontSize: '0.7rem' }}>*</span>
                              )}
                              </span>
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: C.accent, fontSize: '0.75rem', fontWeight: '600', textDecoration: 'none' }}>
                                <Download size={12} /> View
                              </a>
                            ) : (
                              <span style={{
                                fontSize: '0.75rem',
                                // Red "Missing" if it was required, grey "Not uploaded" if optional
                                color: "required" in doc && doc.required ? '#ef4444' : '#9ca3af',
                                fontWeight: "required" in doc && doc.required ? '600' : '400',
                              }}>
                                {"required" in doc && doc.required ? "⚠ Missing" : "Not uploaded"}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Bio */}
                      {tutor.bio && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Bio</p>
                          <p style={{ fontSize: '0.8rem', color: C.primary, lineHeight: '1.6' }}>{tutor.bio}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {tutor.rejectionReason && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ef4444', marginBottom: '0.2rem' }}>Rejection Reason:</p>
                          <p style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{tutor.rejectionReason}</p>
                        </div>
                      )}
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