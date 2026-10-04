"use client";

import { ActionRequiredPanel } from "@/components/Tracking/ActionRequiredPanel";
import { DemoVideoCard } from "@/components/Tracking/DemoVideoCard";
import { HomeTuitionStatusCard } from "@/components/Tracking/HomeTuitionStatusCard";
import { MarketplaceStatusCard } from "@/components/Tracking/MarketplaceStatusCard";
import { ProgressTimeline } from "@/components/Tracking/ProgressTimeline";
import { StatusHero } from "@/components/Tracking/StatusHero";
import { StatusHistoryList } from "@/components/Tracking/StatusHistoryList";
import s from "@/components/Tracking/tracking.module.css";
import { TrackingUrlBlock } from "@/components/Tracking/TrackingUrlBlock";
import { VerificationChecklist } from "@/components/Tracking/VerificationChecklist";
import { VerifiedBadgeCard } from "@/components/Tracking/VerifiedBadgeCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { AuthenticatedTrackingPayload } from "@/types/tracking";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";

export default function TutorApplicationStatusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payload, setPayload] = useState<AuthenticatedTrackingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subjectRequests, setSubjectRequests] = useState<{ subject: string; status: string; evidenceRequired?: boolean; evidence?: { url: string; label?: string }[] }[]>([]);
  const [evidenceBusy, setEvidenceBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "tutor") {
      router.replace("/dashboard");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/tracking/application-status");
        const profileRes = await api.get("/tutors/profile/me").catch(() => null);
        if (!cancelled) {
          setPayload(res.data.payload);
          setSubjectRequests(profileRes?.data?.profile?.subjectEligibility || []);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.replace("/onboarding/tutor");
          return;
        }
        if (!cancelled) setError(err?.response?.data?.message || "Unable to load your application status right now.");
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className={s.trackingPage}>
        <div className={s.trackingContainer}>
          <div className={s.spinner} />
          <p className={s.empty}>Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.trackingPage}>
        <div className={s.trackingContainer}>
          <div className={s.card}>
            <h1 className={s.trackingTitle}>Application status</h1>
            <p style={{ color: "#b91c1c" }}>{error}</p>
            <Link href="/dashboard" className={s.ctaButton}>Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className={s.trackingPage}>
        <div className={s.trackingContainer}>
          <div className={s.spinner} />
        </div>
      </div>
    );
  }

  const showActionRequired = payload.actionRequired && (
    payload.canonicalStatus === "ACTION_REQUIRED" ||
    payload.canonicalStatus === "RE_VERIFICATION_REQUIRED" ||
    payload.canonicalStatus === "SUBJECT_ELIGIBILITY_REQUIRED"
  );
  const uploadEvidence = async (subject: string, file: File | undefined) => {
    if (!file) return;
    setEvidenceBusy(subject);
    try {
      const data = new FormData(); data.append("evidence", file); data.append("label", file.name);
      await api.post(`/tutors/subject-eligibility/${encodeURIComponent(subject)}/evidence`, data);
      const profileRes = await api.get("/tutors/profile/me");
      setSubjectRequests(profileRes.data?.profile?.subjectEligibility || []);
    } catch (uploadError: any) {
      setError(uploadError?.response?.data?.message || "Unable to upload supporting evidence right now.");
    } finally { setEvidenceBusy(null); }
  };

  return (
    <div className={s.trackingPage}>
      <div className={s.trackingContainer}>
        <div className={s.trackingHeader}>
          <p className={s.trackingEyebrow}>Tutor account</p>
          <h1 className={s.trackingTitle}>Track Your Tutor Application</h1>
          <p className={s.trackingSubtitle}>
            Live status of your tutor verification, marketplace activation, and home tuition eligibility. The page updates automatically whenever our team reviews your application.
          </p>
        </div>

        <StatusHero
          applicationId={payload.applicationId}
          tutorName={payload.tutorName}
          canonicalStatus={payload.canonicalStatus}
          canonicalStatusLabel={payload.canonicalStatusLabel}
          lastUpdatedAt={payload.lastUpdatedAt}
          submittedAt={payload.submittedAt}
        />

        {(payload.canonicalStatus === "APPROVED_PENDING_AGREEMENT" || payload.canonicalStatus === "AGREEMENT_PENDING" || payload.canonicalStatus === "AGREEMENT_REACCEPTANCE_REQUIRED") && (
          <div style={{
            background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
            borderRadius: 16,
            padding: "24px 28px",
            color: "#FFFFFF",
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#fff" }}>Application Approved by Admin!</h2>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#E0F2FE", lineHeight: 1.6 }}>
              Congratulations! All your submitted credentials and documents have been reviewed and approved. To activate your profile on the TUTORERA marketplace and start receiving students, please review and electronically sign your Tutor Marketplace Agreement.
            </p>
            <div style={{ marginTop: 8 }}>
              <Link
                href="/tutor/accept-agreement"
                style={{
                  display: "inline-block",
                  background: "#FFFFFF",
                  color: "#0369A1",
                  fontWeight: 800,
                  fontSize: 14,
                  padding: "10px 22px",
                  borderRadius: 999,
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                Review &amp; Sign Agreement Now →
              </Link>
            </div>
          </div>
        )}

        {/* Rejection alert — shown when any component is rejected */}
        {payload.verificationComponents && (
          (() => {
            const vc = payload.verificationComponents;
            const rejectedItems = [
              vc.cnic.status === "rejected" && "Identity document",
              vc.degree.status === "rejected" && "Degree document",
              vc.demoVideo.status === "rejected" && "Demo video",
              vc.police.status === "rejected" && "Police certificate",
            ].filter(Boolean) as string[];
            if (rejectedItems.length === 0) return null;
            return (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 8,
              }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#991b1b", fontSize: 15 }}>
                    <AlertTriangle aria-hidden="true" size={17} style={{ verticalAlign: "text-bottom", marginRight: 6 }} /> Action Required — {rejectedItems.length} document{rejectedItems.length !== 1 ? "s" : ""} rejected
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d" }}>
                    {rejectedItems.join(", ")} — please re-upload corrected files.
                  </p>
                </div>
                <Link
                  href="/tutor/resubmit-docs"
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    background: "#dc2626",
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Re-upload Documents →
                </Link>
              </div>
            );
          })()
        )}

        {showActionRequired && payload.actionRequired && (
          <ActionRequiredPanel action={payload.actionRequired} danger={payload.canonicalStatus === "RE_VERIFICATION_REQUIRED"} />
        )}

        <div className={s.grid} style={{ marginBottom: 16 }}>
          <div className={s.card}>
            <div className={s.cardHeader}>
              <p className={s.cardTitle}>Verification progress</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#021550" }}>{payload.progress.percent}%</span>
            </div>
            <div className={s.progressBar}><div style={{ width: `${payload.progress.percent}%` }} /></div>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "#64748b" }}>
              {payload.progress.completed} of {payload.progress.total} verification weight complete. Some items (e.g. demo video, identity document) require admin review.
            </p>
          </div>
          <div className={s.card}>
            <div className={s.cardHeader}>
              <p className={s.cardTitle}>Application details</p>
            </div>
            <div className={s.metaRow}><span className={s.metaLabel}>Application ID</span><span className={s.metaValue}>{payload.applicationId}</span></div>
            <div className={s.metaRow}><span className={s.metaLabel}>Tutor name</span><span className={s.metaValue}>{payload.tutorName}</span></div>
            <div className={s.metaRow}><span className={s.metaLabel}>Submitted on</span><span className={s.metaValue}>{payload.submittedAt ? new Date(payload.submittedAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "—"}</span></div>
            <div className={s.metaRow}><span className={s.metaLabel}>Last updated</span><span className={s.metaValue}>{new Date(payload.lastUpdatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</span></div>
            <div className={s.metaRow}><span className={s.metaLabel}>Re-verification</span><span className={s.metaValue}>{payload.reVerificationRequired ? "Required" : "Not required"}</span></div>
            {payload.suspended && <div className={s.metaRow}><span className={s.metaLabel}>Suspended</span><span className={s.metaValue} style={{ color: "#b91c1c" }}>{payload.suspendedReason || "Yes"}</span></div>}
          </div>
        </div>

        <div className={`${s.grid} ${s.two}`} style={{ marginBottom: 16 }}>
          <MarketplaceStatusCard eligibility={payload.marketplaceEligibility} />
          <HomeTuitionStatusCard eligibility={payload.homeTuitionEligibility} required={payload.homeTuitionRequired} />
        </div>

        {subjectRequests.some((entry) => entry.status === "needs_evidence" || (entry.evidenceRequired && !(entry.evidence || []).length && entry.status !== "approved")) && (
          <div className={s.card} style={{ marginBottom: 16 }}>
            <p className={s.cardTitle} style={{ marginBottom: 6 }}>Subject evidence required</p>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>A conditional teaching subject needs supporting academic or teaching evidence before our team can approve it. Upload a PDF, JPEG, or PNG; uploading does not itself approve the subject.</p>
            {subjectRequests.filter((entry) => entry.status === "needs_evidence" || (entry.evidenceRequired && !(entry.evidence || []).length && entry.status !== "approved")).map((entry) => (
              <div key={entry.subject} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 12 }}>
                <div><strong>{entry.subject}</strong><p style={{ margin: "4px 0 0", fontSize: 12, color: "#92400e" }}>Status: {entry.status.replace("_", " ")}</p></div>
                <label style={{ display: "inline-flex", alignItems: "center", cursor: evidenceBusy === entry.subject ? "wait" : "pointer", padding: "9px 14px", borderRadius: 8, background: "#0329B2", color: "#fff", fontWeight: 700, fontSize: 13, opacity: evidenceBusy === entry.subject ? 0.6 : 1 }}>
                  {evidenceBusy === entry.subject ? "Uploading…" : "Upload evidence"}
                  <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={evidenceBusy === entry.subject} style={{ display: "none" }} onChange={(event) => void uploadEvidence(entry.subject, event.target.files?.[0])} />
                </label>
              </div>
            ))}
          </div>
        )}

        <div className={`${s.grid} ${s.two}`} style={{ marginBottom: 16 }}>
          <div className={s.card}>
            <p className={s.cardTitle} style={{ marginBottom: 12 }}>Verification checklist</p>
            <VerificationChecklist items={payload.verificationChecklist} />
          </div>
          <div className={s.card}>
            <p className={s.cardTitle} style={{ marginBottom: 12 }}>Application progress</p>
            <ProgressTimeline items={payload.timeline} />
          </div>
        </div>

        <div className={`${s.grid} ${s.two}`} style={{ marginBottom: 16 }}>
          <div className={s.card}>
            <p className={s.cardTitle} style={{ marginBottom: 12 }}>Demo video</p>
            <DemoVideoCard
              status={payload.demoVideo.status}
              publicProfileVisible={payload.demoVideo.publicProfileVisible}
              rejectionReason={payload.demoVideo.rejectionReason}
            />
          </div>
          <div className={s.card}>
            <p className={s.cardTitle} style={{ marginBottom: 12 }}>Verified badge</p>
            <VerifiedBadgeCard verified={payload.verifiedBadge} />
          </div>
        </div>

        <div className={s.card} style={{ marginBottom: 16 }}>
          <p className={s.cardTitle} style={{ marginBottom: 12 }}>Public tracking link</p>
          <TrackingUrlBlock applicationId={payload.applicationId} token={payload.trackingToken} />
        </div>

        <div className={s.card}>
          <div className={s.cardHeader}>
            <p className={s.cardTitle}>Application history</p>
          </div>
          <StatusHistoryList history={payload.history} />
        </div>
      </div>
    </div>
  );
}
