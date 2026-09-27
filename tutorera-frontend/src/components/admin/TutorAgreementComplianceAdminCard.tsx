"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { showError, showSuccess } from "@/lib/toast";
import { formatDateLong } from "@/lib/site";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import s from "@/components/Tracking/tracking.module.css";
import { ShieldCheck, Download, Copy, FileText, CheckCircle2 } from "lucide-react";

interface Props {
  tutorUserId: string;
  tutorName: string;
  verificationStatus: string;
}

export default function TutorAgreementComplianceAdminCard({
  tutorUserId,
  tutorName,
  verificationStatus,
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/admin/agreements/tutors/${tutorUserId}`);
        if (mounted) setData(res.data);
      } catch {
        // fail silently or set null
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tutorUserId]);

  const handleDownloadPdf = async (acceptanceId: string) => {
    setDownloading(true);
    try {
      const res = await api.get(`/tutor/agreements/${acceptanceId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TUTORERA-Contract-${tutorName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess("Signed agreement PDF downloaded.");
    } catch (err) {
      showError(err, "Failed to download contract PDF");
    } finally {
      setDownloading(false);
    }
  };

  const copySigningLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/tutor/accept-agreement`);
      showSuccess("Tutor agreement signing link copied.");
    } catch {
      showError("Could not copy signing link.");
    }
  };

  const latest = data?.latestAcceptance;
  const isAccepted = latest && latest.acceptanceStatus === "active";

  return (
    <section className={s.card} style={{ marginBottom: 16 }} aria-labelledby="agreement-compliance-heading">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div>
          <p id="agreement-compliance-heading" className={s.cardTitle} style={{ margin: "0 0 4px" }}>
            Legal Agreement &amp; Compliance Record (ETO 2002)
          </p>
          <p style={{ margin: 0, fontSize: 13, color: TEXT_COLORS.muted }}>
            Mandatory electronic contract under the Electronic Transactions Ordinance, 2002 (Pakistan). Admin approval does not activate marketplace access without this binding agreement.
          </p>
        </div>

        {isAccepted ? (
          <span style={{
            background: STATUS_COLORS.success.bg,
            color: STATUS_COLORS.success.color,
            border: `1px solid ${STATUS_COLORS.success.border}`,
            borderRadius: 999,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
          }}>
            ✓ Agreement Executed &amp; Active
          </span>
        ) : verificationStatus === "approved" ? (
          <span style={{
            background: STATUS_COLORS.warning.bg,
            color: STATUS_COLORS.warning.color,
            border: `1px solid ${STATUS_COLORS.warning.border}`,
            borderRadius: 999,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
          }}>
            Pending Tutor Signature
          </span>
        ) : (
          <span style={{
            background: STATUS_COLORS.neutral.bg,
            color: STATUS_COLORS.neutral.color,
            border: `1px solid ${STATUS_COLORS.neutral.border}`,
            borderRadius: 999,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
          }}>
            Under Verification
          </span>
        )}
      </div>

      {isAccepted ? (
        <div>
          <div style={{
            background: "#F8FAFC",
            border: `1px solid ${UI_COLORS.border}`,
            borderRadius: 8,
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            fontSize: 13,
            marginBottom: 14,
          }}>
            <div>
              <span style={{ color: TEXT_COLORS.muted, display: "block", fontSize: 11 }}>Agreement Version:</span>
              <strong>{latest.agreementVersion}</strong>
            </div>
            <div>
              <span style={{ color: TEXT_COLORS.muted, display: "block", fontSize: 11 }}>Signed By (Typed Name):</span>
              <strong>{latest.electronicSignature}</strong>
            </div>
            <div>
              <span style={{ color: TEXT_COLORS.muted, display: "block", fontSize: 11 }}>Execution Timestamp:</span>
              <strong>{formatDateLong(latest.acceptedAt)}</strong>
            </div>
            <div>
              <span style={{ color: TEXT_COLORS.muted, display: "block", fontSize: 11 }}>Marketplace Commission:</span>
              <strong>{latest.feeDisclosureSnapshot?.marketplaceFeePercent ?? 20}% platform fee</strong>
            </div>
            <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}>
              <span style={{ color: TEXT_COLORS.muted, display: "block", fontSize: 11 }}>Cryptographic Digest (SHA-256):</span>
              <code style={{ fontSize: 11, color: UI_COLORS.accent }}>
                {latest.agreementHash}
              </code>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleDownloadPdf(latest._id)}
              disabled={downloading}
              style={{
                background: UI_COLORS.surface,
                color: TEXT_COLORS.primary,
                border: `1px solid ${UI_COLORS.border}`,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: downloading ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              {downloading ? "Preparing PDF..." : "Download Executed Contract (PDF)"}
            </button>
          </div>
        </div>
      ) : verificationStatus === "approved" ? (
        <div style={{
          background: STATUS_COLORS.warning.bg,
          border: `1px solid ${STATUS_COLORS.warning.border}`,
          borderRadius: 8,
          padding: "14px 16px",
          color: STATUS_COLORS.warning.color,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          <strong>Application Approved by Admin — Awaiting Tutor Signature:</strong>
          <p style={{ margin: "4px 0 10px" }}>
            All credentials and documents are approved. In strict compliance with TUTORERA's legal marketplace policy, this tutor cannot bid on student requests, appear in search results, or accept bookings until they log in and electronically execute Version {data?.currentAgreement?.version || "TTA-2026.1"}.
          </p>
          <button
            type="button"
            onClick={copySigningLink}
            style={{
              background: UI_COLORS.surface,
              color: TEXT_COLORS.primary,
              border: `1px solid ${UI_COLORS.border}`,
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Copy size={13} />
            Copy Tutor Agreement Signing URL
          </button>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: TEXT_COLORS.muted }}>
          Agreement execution unlocks automatically once credentials and verification documents receive full admin approval.
        </p>
      )}
    </section>
  );
}
