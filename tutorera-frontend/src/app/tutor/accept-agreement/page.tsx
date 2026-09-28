"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { showError, showSuccess } from "@/lib/toast";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Building2,
  Scale,
  Lock,
} from "lucide-react";

interface AgreementData {
  _id: string;
  agreementType: string;
  version: string;
  title: string;
  content: string;
  country: string;
  countrySchedule?: string;
  contentHash: string;
  effectiveDate: string;
  companyDetails: {
    legalName: string;
    tradingName: string;
    registrationNumber: string;
    taxId: string;
    address: string;
    email: string;
  };
}

interface CurrentAgreementResponse {
  agreement: AgreementData;
  verifiedLegalName: string;
  tutorProfileId: string;
  applicationId: string;
  alreadyAccepted: boolean;
  latestAcceptance?: {
    _id: string;
    agreementVersion: string;
    agreementHash: string;
    acceptedAt: string;
    electronicSignature: string;
    pdfDownloadUrl: string;
  };
  feeSchedule: {
    marketplaceFeePercent: number;
    taxRatePercent: number;
    currency: string;
    summary: string;
  };
}

const MANDATORY_CONSENTS = [
  {
    key: "informationAccurate",
    label: "Accurate & Authentic Information",
    description:
      "I confirm that all personal, academic, identity, qualification, and professional background information submitted to TUTORERA is true, accurate, and authentic in all respects.",
  },
  {
    key: "agreementAccepted",
    label: "Tutor Agreement Terms (TTA-2026.1)",
    description:
      "I have thoroughly read, understood, and unconditionally agree to the TUTORERA Tutor Marketplace & Independent Tutor Agreement, including all terms, dispute resolution mechanisms, and operational rules.",
  },
  {
    key: "safeguardingAccepted",
    label: "Child Safeguarding, Code of Conduct & Academic Integrity",
    description:
      "I agree to adhere strictly to TUTORERA's Child Safeguarding Policy, zero-tolerance child protection standards, Academic Integrity policies, and professional conduct requirements at all times.",
  },
  {
    key: "independentProvider",
    label: "Independent Contractor Relationship",
    description:
      "I acknowledge and agree that I participate as an independent freelance service provider, not an employee, agent, worker, partner, or joint venturer of TUTORERA or MENTISERA (SMC-Private) Limited.",
  },
  {
    key: "feesTaxesUnderstood",
    label: "Marketplace Platform Fees & Tax Responsibilities",
    description:
      "I understand and agree to the 20% marketplace platform commission deduction on bookings, and acknowledge that I am solely responsible for calculating, filing, and paying all personal taxes under applicable Pakistani laws (FBR / provincial authorities).",
  },
  {
    key: "electronicRecordsConsent",
    label: "Electronic Contracting & Signature Consent (ETO 2002)",
    description:
      "I consent to contracting electronically under the Electronic Transactions Ordinance, 2002 (ETO 2002), and agree that entering my typed full legal name constitutes a legally valid, binding, and enforceable electronic signature.",
  },
];

export default function AcceptTutorAgreementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [agreementInfo, setAgreementInfo] = useState<CurrentAgreementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Form State
  const [checkedConsents, setCheckedConsents] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState("");
  const [showFullSchedule, setShowFullSchedule] = useState(true);

  // Success execution state
  const [executedRecord, setExecutedRecord] = useState<{
    acceptanceId: string;
    acceptedAt: string;
    agreementHash: string;
    agreementVersion: string;
    electronicSignature: string;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "tutor" && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/tutor/agreements/current");
        if (isMounted) {
          setAgreementInfo(res.data);
          if (res.data.alreadyAccepted && res.data.latestAcceptance) {
            setExecutedRecord({
              acceptanceId: res.data.latestAcceptance._id,
              acceptedAt: res.data.latestAcceptance.acceptedAt,
              agreementHash: res.data.latestAcceptance.agreementHash,
              agreementVersion: res.data.latestAcceptance.agreementVersion,
              electronicSignature: res.data.latestAcceptance.electronicSignature,
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          showError(err, "Failed to load agreement. Please refresh or contact support.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, router]);

  const verifiedName = agreementInfo?.verifiedLegalName || user?.name || "";
  const signatureMatches =
    signature.trim().length > 0 &&
    signature.trim().toLowerCase() === verifiedName.trim().toLowerCase();

  const allConsentsChecked = MANDATORY_CONSENTS.every(
    (c) => checkedConsents[c.key] === true
  );

  const canSubmit = allConsentsChecked && signatureMatches && !submitting;

  const handleConsentToggle = (key: string) => {
    setCheckedConsents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAcceptAgreement = async () => {
    if (!canSubmit) {
      if (!allConsentsChecked) {
        showError("Please check all mandatory consent checkboxes to proceed.");
      } else if (!signatureMatches) {
        showError(`Please type your exact verified legal name: "${verifiedName}".`);
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        agreementId: agreementInfo?.agreement?._id,
        electronicSignature: signature.trim(),
        confirmations: checkedConsents,
      };

      const res = await api.post("/tutor/agreements/accept", payload);

      showSuccess("Agreement executed successfully! Your tutor account is now active.");
      setExecutedRecord({
        acceptanceId: res.data.acceptanceId,
        acceptedAt: res.data.acceptedAt || new Date().toISOString(),
        agreementHash: res.data.agreementHash,
        agreementVersion: res.data.agreementVersion || agreementInfo?.agreement?.version || "TTA-2026.1",
        electronicSignature: signature.trim(),
      });
    } catch (err: any) {
      showError(err, "Failed to submit agreement acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (acceptanceId: string) => {
    setDownloadingPdf(true);
    try {
      const response = await api.get(`/tutor/agreements/${acceptanceId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TUTORERA-Agreement-${agreementInfo?.agreement?.version || "TTA-2026.1"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess("Executed contract PDF downloaded.");
    } catch (err: any) {
      showError(err, "Unable to download contract PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ width: 44, height: 44, border: "4px solid #E2E8F0", borderTopColor: "#0284C7", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#475569", fontWeight: 600, fontSize: 15 }}>Loading Tutor Agreement & Verification Records…</p>
        </div>
      </main>
    );
  }

  const agreement = agreementInfo?.agreement;
  const company = agreement?.companyDetails;

  return (
    <main style={{ minHeight: "100vh", background: "#F1F5F9", padding: "36px 16px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Top Breadcrumb & Status Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Link
            href="/tutor/application-status"
            style={{ color: "#0284C7", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            ← Back to Application Status
          </Link>
          <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
            Jurisdiction: <strong style={{ color: "#0F172A" }}>Pakistan (ETO 2002)</strong>
          </span>
        </div>

        {/* Post-Acceptance / Active Contract Confirmation */}
        {executedRecord && (
          <div
            style={{
              background: "#FFFFFF",
              border: "2px solid #10B981",
              borderRadius: 16,
              padding: "32px 28px",
              marginBottom: 28,
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1), 0 8px 10px -6px rgba(16, 185, 129, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#ECFDF5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "#D1FAE5",
                    color: "#065F46",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 999,
                    marginBottom: 8,
                  }}
                >
                  Active &amp; Legally Binding Contract
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
                  Tutor Marketplace Agreement Executed
                </h2>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
                  Congratulations! Your explicit electronic contract has been accepted and recorded. Your tutor profile is now fully activated and eligible to bid on student requests and appear in TUTORERA's verified public directory.
                </p>

                {/* Audit Evidence Grid */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                    fontSize: 12,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Contract Version:</span>
                    <strong style={{ color: "#0F172A" }}>{executedRecord.agreementVersion}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Executed By:</span>
                    <strong style={{ color: "#0F172A" }}>{executedRecord.electronicSignature}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Execution Timestamp:</span>
                    <strong style={{ color: "#0F172A" }}>
                      {new Date(executedRecord.acceptedAt).toLocaleString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </strong>
                  </div>
                  <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}>
                    <span style={{ color: "#64748B", display: "block" }}>Cryptographic SHA-256 Digest:</span>
                    <code style={{ color: "#0369A1", background: "#E0F2FE", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
                      {executedRecord.agreementHash}
                    </code>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(executedRecord.acceptanceId)}
                    disabled={downloadingPdf}
                    style={{
                      background: "#0284C7",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "11px 20px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: downloadingPdf ? "wait" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Download size={16} />
                    {downloadingPdf ? "Generating PDF…" : "Download Signed Contract (PDF)"}
                  </button>
                  <Link
                    href="/dashboard"
                    style={{
                      background: "#0F172A",
                      color: "#FFFFFF",
                      borderRadius: 10,
                      padding: "11px 20px",
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    Go to Tutor Dashboard →
                  </Link>
                  <Link
                    href="/profile"
                    style={{
                      background: "#FFFFFF",
                      color: "#334155",
                      border: "1px solid #CBD5E1",
                      borderRadius: 10,
                      padding: "11px 18px",
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ExternalLink size={15} />
                    Manage Tutor Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master Agreement Container */}
        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: 16,
            padding: "36px 32px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: "1px solid #E2E8F0", paddingBottom: 24, marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    background: "#EEF2FF",
                    color: "#4338CA",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                >
                  Version {agreement?.version || "TTA-2026.1"} · Electronic Contracting
                </span>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: "4px 0 8px", letterSpacing: "-0.02em" }}>
                  {agreement?.title || "Tutor Marketplace & Independent Tutor Agreement"}
                </h1>
                <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  Please review all clauses, operating rules, safeguarding requirements, and fee schedules carefully before signing electronically.
                </p>
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 12,
                  textAlign: "right",
                  minWidth: 180,
                }}
              >
                <div style={{ color: "#64748B" }}>Effective Date:</div>
                <div style={{ fontWeight: 700, color: "#0F172A" }}>
                  {agreement?.effectiveDate
                    ? new Date(agreement.effectiveDate).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Immediate"}
                </div>
              </div>
            </div>
          </div>

          {/* Legal Contracting Parties Box */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: "18px 20px",
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#64748B", margin: "0 0 12px", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              <Scale size={16} color="#0284C7" /> Contracting Parties &amp; Legal Entities
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, fontSize: 13 }}>
              <div>
                <span style={{ color: "#64748B", display: "block", fontSize: 11 }}>Platform Operator:</span>
                <strong style={{ color: "#0F172A", display: "block" }}>{company?.legalName || "MENTISERA (SMC-Private) Limited"}</strong>
                <span style={{ color: "#475569" }}>Trading as: {company?.tradingName || "TUTORERA®"}</span>
                <br />
                <span style={{ color: "#64748B", fontSize: 12 }}>{company?.address || "Islamabad, Pakistan"} · {company?.email || "hello@mentisera.pk"}</span>
              </div>
              <div>
                <span style={{ color: "#64748B", display: "block", fontSize: 11 }}>Independent Tutor:</span>
                <strong style={{ color: "#0F172A", display: "block" }}>{verifiedName}</strong>
                <span style={{ color: "#475569" }}>Account Email: {user?.email}</span>
                <br />
                <span style={{ color: "#64748B", fontSize: 12 }}>Application ID: {agreementInfo?.applicationId || "Verified"}</span>
              </div>
            </div>
          </div>

          {/* Transparent Fee Disclosure Card */}
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 12,
              padding: "18px 20px",
              marginBottom: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Building2 size={18} color="#15803D" />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#166534", margin: 0 }}>
                Transparent Marketplace Fee &amp; Commission Disclosure
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#15803D", margin: "0 0 10px", lineHeight: 1.5 }}>
              Under TUTORERA's standard commission structure, the platform deducts a standard <strong>{agreementInfo?.feeSchedule?.marketplaceFeePercent ?? 20}% platform fee</strong> on completed tutoring bookings to cover matchmaking, secure payment processing, dispute resolution, and continuous verification services.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#166534" }}>
              <span>✓ Payouts processed every Monday via Bank Transfer / Raast</span>
              <span>✓ No hidden charges or registration sign-up fees</span>
              <span>✓ Direct earnings statements generated with each booking</span>
            </div>
          </div>

          {/* Full Agreement Text Reader */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={18} color="#0284C7" /> Master Agreement Terms &amp; Conditions
              </h3>
              <span style={{ fontSize: 12, color: "#64748B" }}>Scroll through all clauses below</span>
            </div>

            <div
              style={{
                height: 380,
                overflowY: "auto",
                border: "1px solid #CBD5E1",
                borderRadius: 10,
                padding: "20px 24px",
                background: "#FAFAFA",
                fontSize: 13,
                lineHeight: 1.7,
                color: "#334155",
                whiteSpace: "pre-wrap",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              {agreement?.content}

              {/* Pakistan Schedule Display */}
              {agreement?.countrySchedule && (
                <div style={{ marginTop: 24, paddingTop: 18, borderTop: "2px solid #E2E8F0" }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 10px" }}>
                    Schedule PK — Pakistan Specific Legal Provisions
                  </h4>
                  <p>{agreement.countrySchedule}</p>
                </div>
              )}
            </div>
          </div>

          {/* 6 Mandatory Consents (Un-prechecked) */}
          <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 28, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <ShieldCheck size={20} color="#0284C7" />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Mandatory Declarations &amp; Consents
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 18px" }}>
              All 6 declarations are mandatory. You must review and confirm each statement individually:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MANDATORY_CONSENTS.map((item, index) => {
                const isChecked = Boolean(checkedConsents[item.key]);
                return (
                  <label
                    key={item.key}
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: isChecked ? "#F0F9FF" : "#F8FAFC",
                      border: `1px solid ${isChecked ? "#BAE6FD" : "#E2E8F0"}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleConsentToggle(item.key)}
                      style={{
                        marginTop: 3,
                        width: 18,
                        height: 18,
                        accentColor: "#0284C7",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: isChecked ? "#0369A1" : "#0F172A", marginBottom: 3 }}>
                        {index + 1}. {item.label}
                      </span>
                      <span style={{ display: "block", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                        {item.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Typed Electronic Signature Section */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              padding: "24px 22px",
              marginBottom: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Lock size={18} color="#0284C7" />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Electronic Signature (Electronic Transactions Ordinance, 2002)
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px", lineHeight: 1.5 }}>
              To execute this agreement, please type your full legal name exactly as verified on your national identity document / CNIC (<strong>{verifiedName}</strong>).
            </p>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="electronicSignature" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Full Legal Name Signature:
              </label>
              <input
                id="electronicSignature"
                type="text"
                placeholder={verifiedName}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: `2px solid ${signatureMatches ? "#10B981" : signature.length > 0 ? "#F87171" : "#CBD5E1"}`,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Signature Validation Feedback */}
            <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              {signatureMatches ? (
                <span style={{ color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={15} /> Signature matches verified identity record ("{verifiedName}").
                </span>
              ) : signature.length > 0 ? (
                <span style={{ color: "#DC2626", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <AlertCircle size={15} /> Signature must match your verified legal name: "{verifiedName}".
                </span>
              ) : (
                <span style={{ color: "#64748B" }}>
                  Expected signature format: <strong>{verifiedName}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={handleAcceptAgreement}
              disabled={!canSubmit}
              style={{
                width: "100%",
                padding: "16px 24px",
                border: "none",
                borderRadius: 10,
                background: canSubmit ? "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" : "#94A3B8",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 800,
                cursor: canSubmit ? "pointer" : "not-allowed",
                boxShadow: canSubmit ? "0 4px 12px rgba(2, 132, 199, 0.3)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              {submitting ? (
                "Recording Acceptance & Activating Account…"
              ) : (
                <>
                  <Lock size={18} />
                  I Have Read, Understood, and Electronically Execute This Agreement
                </>
              )}
            </button>

            <div style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>
              By executing, an immutable contract record, audit log, and cryptographic hash will be certified under Pakistan law.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
