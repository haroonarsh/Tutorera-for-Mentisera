"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileText, FileSpreadsheet, Search } from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import PayoutReportDownload from "@/components/Finance/PayoutReportDownload";

export default function ReportsHubPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [tutorIdSearch, setTutorIdSearch] = useState("");

  const handleDownloadReport = async (period: "weekly" | "monthly", format: "excel" | "pdf") => {
    const key = `${period}-${format}`;
    setDownloading(key);
    try {
      const response = await api.get("/admin/reports", {
        params: { period, format },
        responseType: "blob",
      });
      const ext = format === "excel" ? "xlsx" : "pdf";
      const filename = `tutorera-${period}-report.${ext}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess(`Downloaded ${filename}`);
    } catch {
      showError("Failed to generate report.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#021550", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Download size={24} color="#0329B2" />
          Reports & Exports Hub
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.95rem" }}>
          Centralized dashboard for generating financial summaries and tutor statements.
        </p>
      </div>

      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        
        {/* Global Financial Summaries */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#021550", marginTop: 0, marginBottom: "0.25rem" }}>Global Platform Reports</h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.5rem" }}>
            Generate comprehensive summaries for finance, bookings, and compliance across the platform.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "0.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#021550", margin: "0 0 0.75rem 0" }}>Weekly Summary</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleDownloadReport("weekly", "pdf")}
                  disabled={downloading === "weekly-pdf"}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "#EEF5FF", color: "#0329B2", border: "1px solid #bfdbfe", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", opacity: downloading === "weekly-pdf" ? 0.7 : 1 }}
                >
                  <FileText size={16} /> {downloading === "weekly-pdf" ? "Generating..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadReport("weekly", "excel")}
                  disabled={downloading === "weekly-excel"}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", opacity: downloading === "weekly-excel" ? 0.7 : 1 }}
                >
                  <FileSpreadsheet size={16} /> {downloading === "weekly-excel" ? "Generating..." : "Download Excel"}
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "0.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#021550", margin: "0 0 0.75rem 0" }}>Monthly Summary</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleDownloadReport("monthly", "pdf")}
                  disabled={downloading === "monthly-pdf"}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "#EEF5FF", color: "#0329B2", border: "1px solid #bfdbfe", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", opacity: downloading === "monthly-pdf" ? 0.7 : 1 }}
                >
                  <FileText size={16} /> {downloading === "monthly-pdf" ? "Generating..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadReport("monthly", "excel")}
                  disabled={downloading === "monthly-excel"}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", opacity: downloading === "monthly-excel" ? 0.7 : 1 }}
                >
                  <FileSpreadsheet size={16} /> {downloading === "monthly-excel" ? "Generating..." : "Download Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Tutor Statements */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#021550", marginTop: 0, marginBottom: "0.25rem" }}>Tutor Payout Statements</h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.5rem" }}>
            Generate a detailed statement for a specific tutor by entering their exact Tutor ID.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#021550" }}>Tutor System ID</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="text" 
                  value={tutorIdSearch}
                  onChange={(e) => setTutorIdSearch(e.target.value)}
                  placeholder="e.g. 64b8f..." 
                  style={{ width: "100%", padding: "0.6rem 0.6rem 0.6rem 2.25rem", border: "1px solid #cbd5e1", borderRadius: "0.5rem", fontSize: "0.85rem", color: "#0f172a" }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: "1rem", padding: "1.25rem", background: "#f8fafc", borderRadius: "0.5rem", border: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              {tutorIdSearch.trim().length >= 24 ? (
                <>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", textAlign: "center" }}>
                    Ready to generate statement for: <br/> <strong style={{color:"#021550"}}>{tutorIdSearch.trim()}</strong>
                  </p>
                  <PayoutReportDownload 
                    endpoint={`/admin/tutors/${tutorIdSearch.trim()}/payout-report/pdf`} 
                    label="Generate Statement PDF" 
                  />
                </>
              ) : (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", textAlign: "center" }}>
                  Please enter a valid 24-character Tutor ID to generate their specific payout statement.
                </p>
              )}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <Link href="/admin/tutors" style={{ fontSize: "0.85rem", color: "#0329B2", fontWeight: 600, textDecoration: "none" }}>
                Browse Tutors Directory →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
