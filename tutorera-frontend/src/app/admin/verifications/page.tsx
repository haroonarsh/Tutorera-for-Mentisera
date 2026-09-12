"use client";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, EyeOff, Clock, Download, ExternalLink } from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";

const C = UI_COLORS;

interface ComponentStatus {
  status: "not_submitted" | "pending" | "approved" | "rejected" | "not_required";
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface Application {
  applicationId: string;
  tutorUserId: string;
  tutorName: string;
  tutorEmail: string;
  profile: {
    _id: string;
    cnicFront: string;
    cnicBack: string;
    videoIntro: string;
    policeCertificate: string;
    teachingMode: string;
  };
  verificationComponents: {
    cnic: ComponentStatus;
    degree: ComponentStatus;
    demoVideo: ComponentStatus;
    police: ComponentStatus;
  };
}

export default function VerificationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("UNDER_REVIEW");
  const [componentRejecting, setComponentRejecting] = useState<{ appId: string; component: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchApplications = async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/tracking/admin/applications?status=${filter}&page=${page}&limit=20`);
      setApplications(res.data.applications);
      setPagination(res.data.pagination);
    } catch (err) {
      showError("Failed to load applications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(1); }, [filter]);

  const componentMap = {
    cnic: { label: "CNIC", endpoint: "cnic" },
    degree: { label: "Educational Document", endpoint: "degree" },
    demoVideo: { label: "Demo Video", endpoint: "demo-video" },
    police: { label: "Police Certificate", endpoint: "police" },
  };

  const handleComponentApprove = async (appId: string, component: keyof typeof componentMap) => {
    setActionLoading(`${appId}-${component}`);
    try {
      await api.patch(`/tracking/admin/applications/${appId}/${componentMap[component].endpoint}`, {
        status: "approved",
      });
      showSuccess(`${componentMap[component].label} approved`);
      fetchApplications(pagination.page);
    } catch (err) {
      showError(`Failed to approve ${componentMap[component].label}`);
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComponentReject = async (appId: string, component: keyof typeof componentMap) => {
    if (!rejectReason.trim()) {
      showError("Please provide a rejection reason.");
      return;
    }
    setActionLoading(`${appId}-${component}`);
    try {
      await api.patch(`/tracking/admin/applications/${appId}/${componentMap[component].endpoint}`, {
        status: "rejected",
        reason: rejectReason,
      });
      showSuccess(`${componentMap[component].label} rejected`);
      setComponentRejecting(null);
      setRejectReason("");
      fetchApplications(pagination.page);
    } catch (err) {
      showError(`Failed to reject ${componentMap[component].label}`);
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string; icon: string }> = {
      pending: { bg: STATUS_COLORS.warning.bg, color: STATUS_COLORS.warning.color, icon: '⏱️' },
      approved: { bg: STATUS_COLORS.success.bg, color: STATUS_COLORS.success.color, icon: '✅' },
      rejected: { bg: STATUS_COLORS.danger.bg, color: STATUS_COLORS.danger.color, icon: '❌' },
      not_submitted: { bg: STATUS_COLORS.neutral.bg, color: STATUS_COLORS.neutral.color, icon: '⬜' },
      not_required: { bg: STATUS_COLORS.purple.bg, color: STATUS_COLORS.purple.color, icon: '➖' },
    };
    const config = colors[status] || colors.pending;
    return (
      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: config.bg, color: config.color }}>
        {config.icon} {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const filterOptions = [
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "ACTION_REQUIRED", label: "Action Required" },
    { key: "APPROVED_FOR_MARKETPLACE", label: "Approved" },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Tutor Application Verifications</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Review tutor applications component-by-component and approve/reject individual documents.</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {filterOptions.map(opt => (
          <button key={opt.key} onClick={() => setFilter(opt.key)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: filter === opt.key ? 'none' : `1px solid ${C.border}`, cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', backgroundColor: filter === opt.key ? C.primary : 'white', color: filter === opt.key ? 'white' : C.gray500 }}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ width: '36px', height: '36px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : applications.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '4rem', textAlign: 'center', border: `1px solid ${C.border}` }}>
          <Clock size={40} color={C.border} style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: C.gray500, fontWeight: '600' }}>No applications in this status</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map(app => (
            <div key={app.applicationId} style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: `1px solid ${C.border}`, overflow: 'hidden' }}>

              {/* Header Row */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: 1 }}>
                  <div style={{ width: '44px', height: '44px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
                    {app.tutorName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: '700', color: C.primary, fontSize: '1rem' }}>{app.tutorName}</p>
                    <p style={{ color: C.gray500, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.tutorEmail}</p>
                    <p style={{ color: C.gray500, fontSize: '0.75rem' }}>ID: {app.applicationId}</p>
                  </div>
                </div>
                <button onClick={() => setExpanded(expanded === app.applicationId ? null : app.applicationId)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', border: `1px solid ${C.border}`, borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: C.primary }}>
                  {expanded === app.applicationId ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> View Details</>}
                </button>
              </div>

              {/* Component Status Grid */}
              <div style={{ padding: '1.25rem 1.5rem', backgroundColor: C.card, borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {Object.entries(componentMap).map(([key, { label }]) => {
                  const comp = app.verificationComponents[key as keyof typeof componentMap];
                  const isRejecting = componentRejecting?.appId === app.profile._id && componentRejecting?.component === key;
                  return (
                    <div key={key} style={{ padding: '0.75rem', border: `1px solid ${C.border}`, borderRadius: '0.5rem', backgroundColor: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary }}>{label}</span>
                        {statusBadge(comp.status)}
                      </div>
                      {comp.status === "rejected" && comp.rejectionReason && (
                        <div style={{ fontSize: '0.75rem', color: STATUS_COLORS.danger.color, marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: STATUS_COLORS.danger.bg, borderRadius: '0.25rem', maxHeight: '60px', overflow: 'hidden' }}>
                          <strong>Feedback:</strong> {comp.rejectionReason}
                        </div>
                      )}
                      {comp.reviewedAt && (
                        <p style={{ fontSize: '0.7rem', color: C.gray500, marginBottom: '0.5rem' }}>
                          Reviewed: {new Date(comp.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                      {comp.status === "pending" && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button
                            onClick={() => handleComponentApprove(app.profile._id, key as keyof typeof componentMap)}
                            disabled={actionLoading === `${app.profile._id}-${key}`}
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: '600', background: STATUS_COLORS.success.bg, color: STATUS_COLORS.success.color, border: `1px solid ${STATUS_COLORS.success.border}`, borderRadius: '0.375rem', cursor: 'pointer' }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => setComponentRejecting({ appId: app.profile._id, component: key })}
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: '600', background: STATUS_COLORS.danger.bg, color: STATUS_COLORS.danger.color, border: `1px solid ${STATUS_COLORS.danger.border}`, borderRadius: '0.375rem', cursor: 'pointer' }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                      {isRejecting && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: STATUS_COLORS.danger.bg, borderRadius: '0.375rem' }}>
                          <input
                            type="text"
                            placeholder="Feedback..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', border: `1px solid ${STATUS_COLORS.danger.border}`, borderRadius: '0.25rem', marginBottom: '0.3rem', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              onClick={() => handleComponentReject(app.profile._id, key as keyof typeof componentMap)}
                              disabled={actionLoading === `${app.profile._id}-${key}`}
                              style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: '600', background: STATUS_COLORS.danger.color, color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => { setComponentRejecting(null); setRejectReason(""); }}
                              style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: '600', background: C.border, color: TEXT_COLORS.secondary, border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Expanded Details */}
              {expanded === app.applicationId && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Application Info */}
                    <div style={{ backgroundColor: C.gray50, borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: C.primary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Application Info</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { label: "Name", value: app.tutorName },
                          { label: "Email", value: app.tutorEmail },
                          { label: "Teaching Mode", value: app.profile.teachingMode },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: C.gray500 }}>{item.label}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: C.primary, textTransform: 'capitalize' }}>{item.value || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Summary */}
                    <div style={{ backgroundColor: C.gray50, borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: C.primary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 Status Summary</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(componentMap).map(([key, { label }]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: C.gray600 }}>{label}</span>
                            {statusBadge(app.verificationComponents[key as keyof typeof componentMap].status)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documents */}
                    <div style={{ backgroundColor: C.gray50, borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: C.primary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📄 Documents</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { label: "CNIC Front", url: app.profile.cnicFront },
                          { label: "CNIC Back", url: app.profile.cnicBack },
                          { label: "Demo Video", url: app.profile.videoIntro },
                          { label: "Police Cert", url: app.profile.policeCertificate, required: app.profile.teachingMode === "in-person" || app.profile.teachingMode === "both" },
                        ].map(doc => (
                          <div key={doc.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: C.gray600 }}>
                              {doc.label}
                              {"required" in doc && doc.required && <span style={{ color: STATUS_COLORS.danger.color, marginLeft: '3px' }}>*</span>}
                            </span>
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: C.accent, fontSize: '0.75rem', fontWeight: '600', textDecoration: 'none' }}>
                                <Download size={12} /> View
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: "required" in doc && doc.required ? STATUS_COLORS.danger.color : C.gray500, fontWeight: "required" in doc && doc.required ? '600' : '400' }}>
                                {"required" in doc && doc.required ? "Missing ⚠" : "—"}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchApplications(page)}
              disabled={loading}
              style={{
                padding: '0.5rem 0.75rem',
                border: page === pagination.page ? 'none' : `1px solid ${C.border}`,
                background: page === pagination.page ? C.primary : 'white',
                color: page === pagination.page ? 'white' : C.primary,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
