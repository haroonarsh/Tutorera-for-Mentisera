"use client";
import { useEffect, useState } from "react";
import { Users, ShieldCheck, BookOpen, MessageSquare } from "lucide-react";
import api from "@/lib/axios";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280' };

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0, totalTutors: 0,
    pendingVerifications: 0, totalContacts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, verificationsRes, contactsRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/verifications"),
          api.get("/contact"),
        ]);
        setStats({
          totalUsers: usersRes.data.total,
          totalTutors: usersRes.data.users.filter((u: {role: string}) => u.role === "tutor").length,
          pendingVerifications: verificationsRes.data.total,
          totalContacts: contactsRes.data.total,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: <Users size={22} color={C.accent} />, bg: '#eff6ff' },
    { label: "Total Tutors", value: stats.totalTutors, icon: <BookOpen size={22} color="#16a34a" />, bg: '#f0fdf4' },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: <ShieldCheck size={22} color="#d97706" />, bg: '#fffbeb' },
    { label: "Contact Messages", value: stats.totalContacts, icon: <MessageSquare size={22} color="#7c3aed" />, bg: '#f5f3ff' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Admin Dashboard</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: card.bg, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.6rem', fontWeight: '800', color: C.primary }}>{loading ? "..." : card.value}</p>
              <p style={{ fontSize: '0.8rem', color: C.gray500 }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', color: C.primary, marginBottom: '1.25rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/admin/verifications" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#fffbeb', color: '#d97706', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem', border: '1px solid #fde68a' }}>
            ⏳ Review Pending Tutors
          </a>
          <a href="/admin/users" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#eff6ff', color: C.accent, borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem', border: '1px solid #bfdbfe' }}>
            👥 Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}