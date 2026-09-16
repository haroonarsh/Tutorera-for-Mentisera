"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentDashboard from "@/components/Dashboard/StudentDashboard";
import TutorDashboard from "@/components/Dashboard/TutorDashboard";
import ParentDashboard from "@/components/Dashboard/ParentDashboard";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import api from "@/lib/axios";
import { SUPPORT_EMAIL } from "@/lib/site";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { DashCard, DashButton } from "@/components/Dashboard/ui";

const C = UI_COLORS;

// ─── Gate screen shell ─────────────────────────────────────────────────────────
// Shared shell for the loading / pending / rejected / error states below - a
// centered card with an icon roundel, heading, body copy and action row.
// These four screens previously each hand-rolled their own near-identical
// card with slightly different hex values; this keeps them visually
// identical by construction.

function GateScreen({ icon, iconTone = "info", title, children, actions }: {
  icon: React.ReactNode;
  iconTone?: keyof typeof STATUS_COLORS;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const tone = STATUS_COLORS[iconTone];
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.gray50, padding: "2rem" }}>
      <DashCard padding="lg" style={{ maxWidth: "520px", width: "100%", textAlign: "center", borderRadius: "1.25rem" }}>
        <div style={{ width: 72, height: 72, backgroundColor: tone.bg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "2rem" }}>
          {icon}
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: TEXT_COLORS.primary, marginBottom: "0.75rem" }}>
          {title}
        </h2>
        {children}
        {actions && (
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
            {actions}
          </div>
        )}
      </DashCard>
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <DashboardLayout>
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: C.gray50,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `3px solid ${C.border}`,
          borderTopColor: C.accent,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: TEXT_COLORS.muted, fontSize: 14, margin: 0 }}>
        Loading your dashboard…
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
    </DashboardLayout>
  );
}

// ─── Pending approval screen ──────────────────────────────────────────────────

function PendingApprovalScreen() {
  return (
    <GateScreen
      icon="⏳"
      iconTone="warning"
      title="Profile Under Review"
      actions={<>
        <DashButton variant="primary" href="/tutor/application-status">🔍 Track Application Status</DashButton>
        <DashButton variant="secondary" href="/onboarding/tutor">✏️ Correct Info / Documents</DashButton>
      </>}
    >
      <p style={{ color: TEXT_COLORS.muted, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "2rem" }}>
        Your tutor profile has been submitted and is currently being reviewed by our team.
        This typically takes <strong>24–48 hours</strong>. You&apos;ll receive an email notification once approved.
      </p>

      {/* Steps */}
      <div style={{ backgroundColor: C.gray50, borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "2rem", textAlign: "left" }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: TEXT_COLORS.primary, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>What happens next?</p>
        {[
          { icon: "✅", text: "Profile submitted successfully" },
          { icon: "🔍", text: "Admin reviews your documents (24–48 hrs)", active: true },
          { icon: "📧", text: "You receive an approval email" },
          { icon: "🚀", text: "Full dashboard access unlocked" },
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>{step.icon}</span>
            <span style={{ fontSize: "0.85rem", color: step.active ? TEXT_COLORS.primary : TEXT_COLORS.muted, fontWeight: step.active ? 600 : 400 }}>
              {step.text}
            </span>
            {step.active && (
              <span style={{ marginLeft: "auto", backgroundColor: STATUS_COLORS.warning.bg, color: STATUS_COLORS.warning.color, fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "999px", flexShrink: 0 }}>
                In Progress
              </span>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: "0.8rem", color: TEXT_COLORS.muted }}>
        Questions? Contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.accent, fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </GateScreen>
  );
}

// ─── Rejected screen ──────────────────────────────────────────────────────────

function RejectedScreen({ reason }: { reason?: string }) {
  const router = useRouter();
  return (
    <GateScreen
      icon="❌"
      iconTone="danger"
      title="Action Required: Profile Not Approved"
      actions={<>
        <DashButton variant="primary" onClick={() => router.push("/tutor/resubmit-docs")}>Fix & Re-submit Documents</DashButton>
        <DashButton variant="secondary" onClick={() => router.push("/tutor/application-status")}>View Status Details</DashButton>
        <DashButton variant="ghost" href={`mailto:${SUPPORT_EMAIL}`}>Contact Support</DashButton>
      </>}
    >
      <p style={{ color: TEXT_COLORS.muted, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
        One or more submitted documents or details need correction. Review the admin note below and re-submit your documents.
      </p>

      {/* Rejection reason from admin */}
      {reason && (
        <div style={{ backgroundColor: STATUS_COLORS.danger.bg, border: `1px solid ${STATUS_COLORS.danger.border}`, borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: STATUS_COLORS.danger.color, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason from admin:</p>
          <p style={{ fontSize: "0.875rem", color: STATUS_COLORS.danger.color, lineHeight: 1.6, margin: 0 }}>{reason}</p>
        </div>
      )}
    </GateScreen>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message?: string }) {
  return (
    <GateScreen
      icon="⚠️"
      iconTone="danger"
      title="Unable to Load Status"
      actions={<>
        <DashButton variant="primary" href={`mailto:${SUPPORT_EMAIL}`}>Contact Support</DashButton>
        <DashButton variant="secondary" onClick={() => window.location.reload()}>Retry</DashButton>
      </>}
    >
      <p style={{ color: TEXT_COLORS.muted, fontSize: "0.9rem", lineHeight: 1.7 }}>
        {message || "We couldn't load your verification status. Please check your connection and try again."}
      </p>
    </GateScreen>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user?.role === "pending") {
      router.replace("/select-role");
    }
    if (!loading && user?.role === "admin") {
      router.replace("/admin");
    }
    if (!loading && user?.role === "parent") {
      // Parent goes directly to dashboard — no verification gate needed
    }
  }, [user, loading, router]);

   // For tutors: fetch verification status
  useEffect(() => {
    if (!user || user.role !== "tutor") return;

    const fetchStatus = async () => {
      setCheckingStatus(true);
      try {
        const res = await api.get("/tracking/application-status");
        const payload = res.data?.payload;
        const eligible = payload?.marketplaceEligibility?.eligible;
        const canonicalStatus = payload?.canonicalStatus;
        setVerificationStatus(eligible ? "approved" : (canonicalStatus === "REJECTED" || canonicalStatus === "SUSPENDED" || canonicalStatus === "ACTION_REQUIRED" ? "rejected" : "pending"));
        setRejectionReason(payload?.marketplaceEligibility?.reasonIfBlocked || payload?.actionRequired?.body || "");
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.replace("/onboarding/tutor");
          return;
        }
        setVerificationStatus("error");
        setRejectionReason("Unable to load verification status. Please try again later or contact support.");
      } finally {
        setCheckingStatus(false);
      }
    };

    fetchStatus();
  }, [user]);

  // Show loading while auth or status check is in progress
  if (loading || !user || user.role === "pending" || user.role === "admin" || (user.role === "tutor" && (checkingStatus || verificationStatus === null))) {
    return <LoadingScreen />;
  }

   // Tutor-specific verification gates
   if (user.role === "tutor") {
     if (verificationStatus === "pending") {
       return <PendingApprovalScreen />;
     }
     if (verificationStatus === "rejected") {
       return <RejectedScreen reason={rejectionReason} />;
     }
     if (verificationStatus === "error") {
       return <ErrorScreen message={rejectionReason} />;
     }
   }

   // Approved tutor or student — show dashboard
  if (user.role === "tutor") {
    return (
      <DashboardLayout>
        <TutorDashboard
          userId={user._id}
          userName={user.name}
          userAvatar={user.avatar}
        />
      </DashboardLayout>
    );
  }

  if (user.role === "parent") {
    return (
      <DashboardLayout>
        <ParentDashboard userId={user._id} userName={user.name} userAvatar={user.avatar} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <StudentDashboard
        userName={user.name}
        userAvatar={user.avatar}
      />
    </DashboardLayout>
  );
}
