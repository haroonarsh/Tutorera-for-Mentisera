"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { showError, showSuccess } from "@/lib/toast";
import { FileText, Download, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";

interface AgreementStatusData {
  agreement: {
    _id: string;
    version: string;
    title: string;
    contentHash: string;
    effectiveDate: string;
  };
  verifiedLegalName: string;
  alreadyAccepted: boolean;
  latestAcceptance?: {
    _id: string;
    agreementVersion: string;
    agreementHash: string;
    acceptedAt: string;
    electronicSignature: string;
  };
  feeSchedule: {
    marketplaceFeePercent: number;
    currency: string;
  };
}

export default function TutorAgreementCard() {
  const [data, setData] = useState<AgreementStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/tutor/agreements/current");
        if (mounted) setData(res.data);
      } catch {
        // Silently fail if not applicable or unauthorized
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = async (acceptanceId: string) => {
    setDownloading(true);
    try {
      const response = await api.get(`/tutor/agreements/${acceptanceId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TUTORERA-Tutor-Agreement-${data?.agreement?.version || "TTA-2026.1"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess("Signed agreement PDF downloaded.");
    } catch (err: any) {
      showError(err, "Failed to download contract PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Loading contract &amp; compliance status…</p>
      </div>
    );
  }

  if (!data || !data.agreement) return null;

  const isAccepted = data.alreadyAccepted && data.latestAcceptance;

  return (
    <div
      style={{
        background: isAccepted ? "#FFFFFF" : "#FFFBEB",
        border: `1px solid ${isAccepted ? "#CBD5E1" : "#FDE68A"}`,
        borderRadius: 12,
        padding: "20px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: isAccepted ? "#F0FDF4" : "#FEF3C7",
              color: isAccepted ? "#16A34A" : "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isAccepted ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              Tutor Marketplace &amp; Independent Tutor Agreement
            </h3>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              Version {data.agreement.version} · Electronic Transactions Ordinance, 2002 (Pakistan)
            </span>
          </div>
        </div>

        <span
          style={{
            background: isAccepted ? "#DCFCE7" : "#FEF3C7",
            color: isAccepted ? "#15803D" : "#B45309",
            borderRadius: 999,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {isAccepted ? "✓ Legally Binding & Active" : "Action Required · Pending Signature"}
        </span>
      </div>

      {isAccepted ? (
        <div>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
            Your electronic contract is executed and certified on file with TUTORERA and MENTISERA (SMC-Private) Limited.
          </p>

          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "12px 14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <span style={{ color: "#64748B", display: "block" }}>Signed By:</span>
              <strong style={{ color: "#0F172A" }}>{data.latestAcceptance?.electronicSignature}</strong>
            </div>
            <div>
              <span style={{ color: "#64748B", display: "block" }}>Execution Date:</span>
              <strong style={{ color: "#0F172A" }}>
                {data.latestAcceptance?.acceptedAt
                  ? new Date(data.latestAcceptance.acceptedAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </strong>
            </div>
            <div>
              <span style={{ color: "#64748B", display: "block" }}>Platform Commission:</span>
              <strong style={{ color: "#0F172A" }}>{data.feeSchedule.marketplaceFeePercent}% deduction</strong>
            </div>
            <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}>
              <span style={{ color: "#64748B", display: "block" }}>SHA-256 Digest:</span>
              <code style={{ fontSize: 11, color: "#0284C7" }}>{data.latestAcceptance?.agreementHash}</code>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleDownload(data.latestAcceptance!._id)}
              disabled={downloading}
              style={{
                background: "#0284C7",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                cursor: downloading ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              {downloading ? "Preparing PDF…" : "Download Signed Contract (PDF)"}
            </button>
            <Link
              href="/tutor/accept-agreement"
              style={{
                background: "#F1F5F9",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ExternalLink size={14} />
              View Full Agreement
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>
            Your application credentials and documents have been approved by our verification team! Under our legal compliance policy, your tutor profile cannot receive bookings or appear on the marketplace until you explicitly review and sign the electronic agreement.
          </p>
          <Link
            href="/tutor/accept-agreement"
            style={{
              background: "#D97706",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Review &amp; Sign Agreement Now →
          </Link>
        </div>
      )}
    </div>
  );
}
