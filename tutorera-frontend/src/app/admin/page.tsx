"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ShieldCheck, BookOpen, MessageSquare, CheckCircle, Clock, TrendingUp, Download, FileSpreadsheet, FileText } from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

interface Stats {
  totalUsers: number;
  totalTutors: number;
  totalStudents: number;
  pendingVerifications: number;
  approvedTutors: number;
  totalBookings: number;
  totalContacts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    api.get("/admin/stats")
      .then(res => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (period: "weekly" | "monthly", format: "excel" | "pdf") => {
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
      showSuccess(`Report downloaded successfully as ${filename}`);
    } catch {
      showError("Failed to generate report. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: <Users size={22} color={C.accent} />, bg: '#eff6ff', link: "/admin/users" },
    { label: "Total Tutors", value: stats?.totalTutors, icon: <BookOpen size={22} color="#16a34a" />, bg: '#f0fdf4', link: "/admin/users?role=tutor" },
    { label: "Total Students", value: stats?.totalStudents, icon: <Users size={22} color="#7c3aed" />, bg: '#f5f3ff', link: "/admin/users?role=student" },
    { label: "Pending Verifications", value: stats?.pendingVerifications, icon: <Clock size={22} color="#d97706" />, bg: '#fffbeb', link: "/admin/verifications" },
    { label: "Approved Tutors", value: stats?.approvedTutors, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#f0fdf4', link: "/admin/verifications?status=approved" },
    { label: "Total Bookings", value: stats?.totalBookings, icon: <TrendingUp size={22} color={C.accent} />, bg: '#eff6ff', link: "/admin/bookings" },
    { label: "Contact Messages", value: stats?.totalContacts, icon: <MessageSquare size={22} color="#e94560" />, bg: '#fff1f2', link: "/admin/contacts" },
    { label: "Verifications Done", value: (stats?.approvedTutors || 0), icon: <ShieldCheck size={22} color="#16a34a" />, bg: '#f0fdf4', link: "/admin/verifications" },
  ];

  const reportButtons: {
    period: "weekly" | "monthly";
    format: "excel" | "pdf";
    label: string;
    icon: React.ReactNode;
    bg: string;
    color: string;
    border: string;
  }[] = [
    { period: "weekly",  format: "excel", label: "Weekly Excel",   icon: <FileSpreadsheet size={16} />, bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    { period: "weekly",  format: "pdf",   label: "Weekly PDF",     icon: <FileText size={16} />,        bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
    { period: "monthly", format: "excel", label: "Monthly Excel",  icon: <FileSpreadsheet size={16} />, bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    { period: "monthly", format: "pdf",   label: "Monthly PDF",    icon: <FileText size={16} />,        bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Admin Dashboard</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Welcome back! Here's your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {statCards.map(card => (
          <Link key={card.label} href={card.link} style={{ textDecoration: 'none' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ width: '44px', height: '44px', backgroundColor: card.bg, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>{loading ? "..." : card.value ?? 0}</p>
                <p style={{ fontSize: '0.75rem', color: C.gray500 }}>{card.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', color: C.primary, marginBottom: '1.25rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/admin/verifications" style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fffbeb', color: '#d97706', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem', border: '1px solid #fde68a' }}>
            ⏳ Review Pending Tutors ({loading ? "..." : stats?.pendingVerifications ?? 0})
          </Link>
          <Link href="/admin/bookings" style={{ padding: '0.75rem 1.25rem', backgroundColor: '#eff6ff', color: C.accent, borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem', border: '1px solid #bfdbfe' }}>
            📋 Manage Bookings
          </Link>
          <Link href="/admin/payments" style={{ padding: '0.75rem 1.25rem', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem', border: '1px solid #bbf7d0' }}>
            💰 Payment Management
          </Link>
          <Link href="/admin/contacts" style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fff1f2', color: '#e94560', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem', border: '1px solid #fecdd3' }}>
            📬 View Messages
          </Link>
        </div>
      </div>

      {/* ── Generate Reports ── */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Download size={20} color={C.primary} />
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: C.primary, margin: 0 }}>Generate Reports</h2>
        </div>
        <p style={{ color: C.gray500, fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          Download platform reports as Excel or PDF. Reports include bookings, revenue, tutor performance, and student activity.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {reportButtons.map(btn => {
            const key = `${btn.period}-${btn.format}`;
            const isLoading = downloading === key;
            return (
              <button key={key}
                onClick={() => handleDownload(btn.period, btn.format)}
                disabled={isLoading || downloading !== null}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: isLoading ? C.gray50 : btn.bg,
                  color: isLoading ? C.gray500 : btn.color,
                  border: `1px solid ${isLoading ? '#e5e7eb' : btn.border}`,
                  borderRadius: '0.75rem',
                  cursor: isLoading || downloading !== null ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem', fontWeight: '600',
                  transition: 'all 0.2s', textAlign: 'left',
                  opacity: downloading !== null && !isLoading ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!isLoading && !downloading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 36, height: 36, borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isLoading ? (
                    <div style={{ width: 16, height: 16, border: `2px solid ${btn.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : btn.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{btn.label}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.75, fontWeight: 400 }}>
                    {btn.period === "weekly" ? "Last 7 days" : "Last 30 days"} · {btn.format === "excel" ? "4 sheets" : "4 sections"}
                  </p>
                </div>
                {!isLoading && <Download size={14} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}