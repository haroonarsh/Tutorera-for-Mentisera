"use client";

import { use, useEffect, useState } from "react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import s from "@/components/Tracking/tracking.module.css";
import { formatDateLong } from "@/lib/site";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

type Params = Promise<{ id: string }>;

interface ApplicationDetail {
  applicationId: string;
  tutorUserId: string;
  tutorName: string;
  tutorEmail: string;
  isActive: boolean;
  profile: {
    _id: string;
    fullName: string;
    phone: string;
    city: string;
    gender: string;
    dateOfBirth: string;
    bio: string;
    subjects: string[];
    levels: string[];
    hourlyRate: number;
    teachingMode: string;
    education: { degree: string; institution: string; year: number; degreeDoc: string }[];
    cnicFront: string;
    cnicBack: string;
    videoIntro: string;
    policeCertificate: string;
    verificationStatus: string;
    rejectionReason: string;
    onboardingComplete: boolean;
    cnicVerificationStatus: string;
    cnicRejectionReason: string;
    degreeVerificationStatus: string;
    degreeRejectionReason: string;
    demoVideoStatus: string;
    demoVideoRejectionReason: string;
    policeVerificationStatus: string;
    policeRejectionReason: string;
    marketplaceEligible: boolean;
    homeTuitionEligible: boolean;
    suspendedAt: string | null;
    reVerificationRequired: boolean;
    createdAt: string;
  };
  history: { id: string; at: string; event: string; message: string; actor: string; actorRole: string }[];
}

export default function AdminApplicationDetailPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<string>("");
  const [busyKey, setBusyKey] = useState<string>("");

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tracking/admin/applications/${id}`);
      setData(res.data.application);
    } catch {
      setError("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (
    endpoint: string,
    status: string,
    label: string
  ) => {
    setBusyKey(`${endpoint}-${status}`);
    try {
      await api.patch(`/tracking/admin/applications/${id}/${endpoint}`, {
        status,
        reason: reasonFor || undefined,
      });
      showSuccess(`${label} ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"}`);
      setReasonFor("");
      await fetchDetail();
    } catch (err) {
      showError(err, `Failed to ${label.toLowerCase()}`);
    } finally {
      setBusyKey("");
    }
  };

  const handleToggleEligibility = async (kind: "marketplace" | "home-tuition", eligible: boolean) => {
    setBusyKey(`${kind}-${eligible}`);
    try {
      await api.patch(`/tracking/admin/applications/${id}/${kind}`, { eligible, reason: reasonFor || undefined });
      showSuccess(`${kind === "marketplace" ? "Marketplace" : "Home tuition"} ${eligible ? "enabled" : "disabled"}`);
      setReasonFor("");
      await fetchDetail();
    } catch (err) {
      showError(err, "Failed to update eligibility");
    } finally {
      setBusyKey("");
    }
  };

  const handleSuspend = async (suspended: boolean) => {
    setBusyKey(`suspend-${suspended}`);
    try {
      await api.patch(`/tracking/admin/applications/${id}/suspended`, { suspended, reason: reasonFor || undefined });
      showSuccess(suspended ? "Profile suspended" : "Profile re-instated");
      setReasonFor("");
      await fetchDetail();
    } catch (err) {
      showError(err, "Failed to update suspension");
    } finally {
      setBusyKey("");
    }
  };

  const handleReverification = async (required: boolean) => {
    setBusyKey(`reverify-${required}`);
    try {
      await api.patch(`/tracking/admin/applications/${id}/reverification`, { required, reason: reasonFor || undefined });
      showSuccess(required ? "Re-verification requested" : "Re-verification cleared");
      setReasonFor("");
      await fetchDetail();
    } catch (err) {
      showError(err, "Failed to update re-verification");
    } finally {
      setBusyKey("");
    }
  };

  const handleViewDocument = async (field: string) => {
    try {
      const res = await api.get(`/admin/tutors/${id}/document/${field}`);
      window.open(res.data.url, "_blank");
    } catch {
      showError("Failed to load document");
    }
  };

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string>("cnicFront");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVideoUrl, setUploadVideoUrl] = useState<string>("");
  const [uploadAutoApprove, setUploadAutoApprove] = useState<boolean>(true);
  const [uploadSubmitting, setUploadSubmitting] = useState<boolean>(false);

  const openUploadModal = (docType: string) => {
    setUploadDocType(docType);
    setUploadFile(null);
    setUploadVideoUrl("");
    setUploadAutoApprove(true);
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && uploadDocType !== "videoIntro") {
      showError("Please select a file to upload.");
      return;
    }
    if (!uploadFile && uploadDocType === "videoIntro" && !uploadVideoUrl.trim()) {
      showError("Please select a video file or provide a video URL.");
      return;
    }

    setUploadSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("documentType", uploadDocType);
      formData.append("autoApprove", String(uploadAutoApprove));
      if (uploadFile) {
        formData.append("file", uploadFile);
      }
      if (uploadDocType === "videoIntro" && uploadVideoUrl.trim()) {
        formData.append("videoUrl", uploadVideoUrl.trim());
      }

      await api.post(`/tracking/admin/applications/${id}/upload-document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showSuccess(`Document uploaded successfully${uploadAutoApprove ? " and approved" : ""}`);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadVideoUrl("");
      await fetchDetail();
    } catch (err) {
      showError(err, "Failed to upload document");
    } finally {
      setUploadSubmitting(false);
    }
  };

  if (loading) {
    return <div className={s.trackingPage}><div className={s.trackingContainer}><div className={s.spinner} /></div></div>;
  }
  if (error || !data) {
    return (
      <div className={s.trackingPage}>
        <div className={s.trackingContainer}>
          <div className={s.card}>
            <h1>Application not found</h1>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const p = data.profile;
  const isPoliceRequired = p.teachingMode === "in-person" || p.teachingMode === "both";

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "cnicFront": return "CNIC (Front)";
      case "cnicBack": return "CNIC (Back)";
      case "degree": return "Educational Degree / Transcript";
      case "videoIntro": return "Demo Introduction Video";
      case "policeCertificate": return "Police Clearance Certificate";
      default: return type;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: UI_COLORS.accent, margin: "0 0 6px" }}>Admin · Applications</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT_COLORS.primary, margin: "0 0 4px" }}>{data.tutorName}</h1>
        <p style={{ color: TEXT_COLORS.muted, fontSize: 13, margin: "0 0 16px" }}>
          {data.applicationId} · {data.tutorEmail} · Submitted {formatDateLong(p.createdAt)}
        </p>

        <div className={`${s.grid} ${s.two}`} style={{ marginBottom: 16 }}>
          <div className={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className={s.cardTitle} style={{ margin: 0 }}>CNIC verification</p>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => openUploadModal("cnicFront")} style={btnUploadStyle}>+ Upload Front</button>
                <button type="button" onClick={() => openUploadModal("cnicBack")} style={btnUploadStyle}>+ Upload Back</button>
              </div>
            </div>
            <p style={{ fontSize: 13, color: TEXT_COLORS.muted, margin: "0 0 8px" }}>Current: <strong>{p.cnicVerificationStatus}</strong></p>
            {p.cnicRejectionReason && <p style={{ fontSize: 12, color: STATUS_COLORS.danger.color, margin: "0 0 8px" }}>Last reason: {p.cnicRejectionReason}</p>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => handleViewDocument("cnicFront")} style={btnSecondaryStyle}>View front</button>
              <button onClick={() => handleViewDocument("cnicBack")} style={btnSecondaryStyle}>View back</button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <button disabled={busyKey === "cnic-approved"} onClick={() => handleAction("cnic", "approved", "CNIC")} style={btnSuccessStyle}>Approve</button>
              <button disabled={busyKey === "cnic-rejected"} onClick={() => handleAction("cnic", "rejected", "CNIC")} style={btnDangerStyle}>Reject</button>
              <button disabled={busyKey === "cnic-pending"} onClick={() => handleAction("cnic", "pending", "CNIC")} style={btnSecondaryStyle}>Mark pending</button>
            </div>
          </div>

          <div className={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className={s.cardTitle} style={{ margin: 0 }}>Educational documents</p>
              <button type="button" onClick={() => openUploadModal("degree")} style={btnUploadStyle}>+ Upload Degree</button>
            </div>
            <p style={{ fontSize: 13, color: TEXT_COLORS.muted, margin: "0 0 8px" }}>Current: <strong>{p.degreeVerificationStatus}</strong></p>
            {p.degreeRejectionReason && <p style={{ fontSize: 12, color: STATUS_COLORS.danger.color, margin: "0 0 8px" }}>Last reason: {p.degreeRejectionReason}</p>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => handleViewDocument("degreeDoc")} style={btnSecondaryStyle}>View document</button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <button disabled={busyKey === "degree-approved"} onClick={() => handleAction("degree", "approved", "Degree")} style={btnSuccessStyle}>Approve</button>
              <button disabled={busyKey === "degree-rejected"} onClick={() => handleAction("degree", "rejected", "Degree")} style={btnDangerStyle}>Reject</button>
              <button disabled={busyKey === "degree-pending"} onClick={() => handleAction("degree", "pending", "Degree")} style={btnSecondaryStyle}>Mark pending</button>
            </div>
          </div>

          <div className={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className={s.cardTitle} style={{ margin: 0 }}>Demo video</p>
              <button type="button" onClick={() => openUploadModal("videoIntro")} style={btnUploadStyle}>+ Upload / Add Video</button>
            </div>
            <p style={{ fontSize: 13, color: TEXT_COLORS.muted, margin: "0 0 8px" }}>Current: <strong>{p.demoVideoStatus}</strong></p>
            {p.demoVideoRejectionReason && <p style={{ fontSize: 12, color: STATUS_COLORS.danger.color, margin: "0 0 8px" }}>Last reason: {p.demoVideoRejectionReason}</p>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a href={p.videoIntro} target="_blank" rel="noreferrer" style={btnSecondaryStyle}>Open video URL</a>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <button disabled={busyKey === "demo-video-approved"} onClick={() => handleAction("demo-video", "approved", "Demo video")} style={btnSuccessStyle}>Approve</button>
              <button disabled={busyKey === "demo-video-rejected"} onClick={() => handleAction("demo-video", "rejected", "Demo video")} style={btnDangerStyle}>Reject</button>
              <button disabled={busyKey === "demo-video-pending"} onClick={() => handleAction("demo-video", "pending", "Demo video")} style={btnSecondaryStyle}>Mark pending</button>
            </div>
          </div>

          <div className={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className={s.cardTitle} style={{ margin: 0 }}>Police verification {isPoliceRequired ? "" : "(not required)"}</p>
              <button type="button" onClick={() => openUploadModal("policeCertificate")} style={btnUploadStyle}>+ Upload Police Doc</button>
            </div>
            <p style={{ fontSize: 13, color: TEXT_COLORS.muted, margin: "0 0 8px" }}>Current: <strong>{p.policeVerificationStatus}</strong></p>
            {p.policeRejectionReason && <p style={{ fontSize: 12, color: STATUS_COLORS.danger.color, margin: "0 0 8px" }}>Last reason: {p.policeRejectionReason}</p>}
            {isPoliceRequired && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => handleViewDocument("policeCertificate")} style={btnSecondaryStyle}>View certificate</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <button disabled={busyKey === "police-approved"} onClick={() => handleAction("police", "approved", "Police")} style={btnSuccessStyle}>Approve</button>
              <button disabled={busyKey === "police-rejected"} onClick={() => handleAction("police", "rejected", "Police")} style={btnDangerStyle}>Reject</button>
              <button disabled={busyKey === "police-pending"} onClick={() => handleAction("police", "pending", "Police")} style={btnSecondaryStyle}>Mark pending</button>
            </div>
          </div>
        </div>

        <div className={s.card} style={{ marginBottom: 16 }}>
          <p className={s.cardTitle} style={{ marginBottom: 12 }}>Reason (optional for approve, required for reject)</p>
          <textarea
            value={reasonFor}
            onChange={e => setReasonFor(e.target.value)}
            placeholder="Visible to the tutor in the rejection email and tracking page."
            style={{ width: "100%", minHeight: 70, padding: 10, border: `1px solid ${UI_COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
          />
        </div>

        <div className={`${s.grid} ${s.three}`} style={{ marginBottom: 16 }}>
          <div className={s.card}>
            <p className={s.cardTitle} style={{ marginBottom: 8 }}>Marketplace eligibility</p>
            <p style={{ fontSize: 13, color: TEXT_COLORS.muted, margin: "0 0 10px" }}>Currently <strong>{p.marketplaceEligible ? "enabled" : "disabled"}</strong></p>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={busyKey === "marketplace-true"} onClick={() => handleToggleEligibility("marketplace", true)} style={btnSuccessStyle}>Enable</button>
              <button disabled={busyKey === "marketplace-false"} onClick={() => handleToggleEligibility("marketplace", false)} style={btnSecondaryStyle}>Disable</button>
            </div>
          </div>
          <div className={s.card}>
            <p className={s.cardTitle} style={{ marginBottom: 8 }}>Home tuition eligibility</p>
            <p style={{ fontSize: 13, color: TEXT_COLORS.muted, margin: "0 0 10px" }}>Currently <strong>{p.homeTuitionEligible ? "enabled" : "disabled"}</strong></p>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={busyKey === "home-tuition-true"} onClick={() => handleToggleEligibility("home-tuition", true)} style={btnSuccessStyle}>Enable</button>
              <button disabled={busyKey === "home-tuition-false"} onClick={() => handleToggleEligibility("home-tuition", false)} style={btnSecondaryStyle}>Disable</button>
            </div>
          </div>
          <div className={s.card}>
            <p className={s.cardTitle} style={{ marginBottom: 8 }}>Lifecycle controls</p>
            <p style={{ fontSize: 13, color: TEXT_COLORS.muted, margin: "0 0 10px" }}>
              Suspended: <strong>{p.suspendedAt ? "Yes" : "No"}</strong> · Re-verification: <strong>{p.reVerificationRequired ? "Required" : "No"}</strong>
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button disabled={busyKey === "suspend-true"} onClick={() => handleSuspend(true)} style={btnDangerStyle}>Suspend</button>
              <button disabled={busyKey === "suspend-false"} onClick={() => handleSuspend(false)} style={btnSecondaryStyle}>Reinstate</button>
              <button disabled={busyKey === "reverify-true"} onClick={() => handleReverification(true)} style={btnSecondaryStyle}>Require re-verify</button>
              <button disabled={busyKey === "reverify-false"} onClick={() => handleReverification(false)} style={btnSecondaryStyle}>Clear</button>
            </div>
          </div>
        </div>

        <div className={s.card}>
          <p className={s.cardTitle} style={{ marginBottom: 12 }}>Application history</p>
          {data.history.length === 0 ? (
            <p className={s.empty}>No history entries yet.</p>
          ) : (
            <ul className={s.historyList}>
              {data.history.map(h => (
                <li key={h.id} className={s.historyItem}>
                  <span className={s.historyDate}>{formatDateLong(h.at)}</span>
                  <p className={s.historyMessage}><strong>{h.event}</strong> — {h.message} <span style={{ color: UI_COLORS.gray500 }}>({h.actor})</span></p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {uploadModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(2, 21, 80, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
            onClick={() => !uploadSubmitting && setUploadModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: UI_COLORS.surface,
                borderRadius: 16,
                maxWidth: 480,
                width: "100%",
                padding: 24,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT_COLORS.primary, margin: 0 }}>
                    Upload on Tutor&apos;s Behalf
                  </h2>
                  <p style={{ fontSize: 12, color: UI_COLORS.gray500, margin: "2px 0 0" }}>
                    Uploading: {getDocTypeLabel(uploadDocType)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploadSubmitting}
                  style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: UI_COLORS.gray500 }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT_COLORS.secondary, marginBottom: 6 }}>
                    Document Type
                  </label>
                  <select
                    value={uploadDocType}
                    onChange={e => {
                      setUploadDocType(e.target.value);
                      setUploadFile(null);
                      setUploadVideoUrl("");
                    }}
                    style={{ width: "100%", padding: "8px 12px", border: `1px solid ${UI_COLORS.border}`, borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="cnicFront">CNIC (Front) — JPG, PNG, WEBP, PDF</option>
                    <option value="cnicBack">CNIC (Back) — JPG, PNG, WEBP, PDF</option>
                    <option value="degree">Educational Degree / Transcript — JPG, PNG, PDF</option>
                    <option value="videoIntro">Demo Video — MP4 or URL</option>
                    <option value="policeCertificate">Police Verification Certificate — JPG, PNG, PDF</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT_COLORS.secondary, marginBottom: 6 }}>
                    Select File {uploadDocType === "videoIntro" ? "(MP4 format, max 50MB)" : "(PDF, JPG, PNG, WEBP, max 10MB)"}
                  </label>
                  <input
                    type="file"
                    accept={uploadDocType === "videoIntro" ? "video/mp4" : "application/pdf,image/jpeg,image/png,image/webp"}
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    style={{ width: "100%", fontSize: 13 }}
                  />
                  {uploadFile && (
                    <p style={{ fontSize: 11, color: STATUS_COLORS.success.color, margin: "4px 0 0" }}>
                      Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {uploadDocType === "videoIntro" && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT_COLORS.secondary, marginBottom: 6 }}>
                      Or Video Link / Embed URL (YouTube, Vimeo, Cloudinary, etc.)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={uploadVideoUrl}
                      onChange={e => setUploadVideoUrl(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: `1px solid ${UI_COLORS.border}`, borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    id="autoApproveCheck"
                    checked={uploadAutoApprove}
                    onChange={e => setUploadAutoApprove(e.target.checked)}
                    style={{ cursor: "pointer", width: 16, height: 16 }}
                  />
                  <label htmlFor="autoApproveCheck" style={{ fontSize: 13, color: TEXT_COLORS.body, cursor: "pointer", fontWeight: 600 }}>
                    Auto-approve this document immediately
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    disabled={uploadSubmitting}
                    style={btnSecondaryStyle}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadSubmitting}
                    style={{ ...btnSuccessStyle, padding: "8px 18px", opacity: uploadSubmitting ? 0.7 : 1 }}
                  >
                    {uploadSubmitting ? "Uploading & Processing..." : `Upload for ${data.tutorName}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnSecondaryStyle: React.CSSProperties = { background: UI_COLORS.surface, color: TEXT_COLORS.primary, border: `1px solid ${UI_COLORS.border}`, borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" };
const btnSuccessStyle: React.CSSProperties = { background: UI_COLORS.success, color: UI_COLORS.surface, border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const btnDangerStyle: React.CSSProperties = { background: UI_COLORS.error, color: UI_COLORS.surface, border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const btnUploadStyle: React.CSSProperties = { background: STATUS_COLORS.info.bg, color: UI_COLORS.accent, border: `1px solid ${STATUS_COLORS.info.border}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" };
