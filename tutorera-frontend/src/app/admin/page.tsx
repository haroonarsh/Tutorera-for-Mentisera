"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ShieldCheck, BookOpen, MessageSquare, CheckCircle, Clock, TrendingUp } from "lucide-react";
import api from "@/lib/axios";

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

  useEffect(() => {
    api.get("/admin/stats")
      .then(res => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    </div>
  );
}