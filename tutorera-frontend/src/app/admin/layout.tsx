"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, LogOut, BookOpen,
  CreditCard, MessageSquare, Menu, FileText, Shield, Gift,
  Star, Banknote, BarChart2, ClipboardList,
  Radio,
  Layers,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import { useEffect, useState } from "react";

const C = { primary: '#1a1a2e', accent: '#2563eb' };

const navItems = [
  { href: "/admin",                  label: "Dashboard",        icon: <LayoutDashboard size={18} /> },
  { href: "/admin/analytics",        label: "Analytics",        icon: <BarChart2 size={18} /> },
  { href: "/admin/marketplace",      label: "Marketplace",      icon: <ClipboardList size={18} /> },
  { href: "/admin/subscriptions",    label: "Subscriptions",    icon: <Layers size={18} /> },
  { href: "/admin/audit-logs",       label: "Audit Logs",       icon: <ClipboardList size={18} /> },
  { href: "/admin/email-logs",       label: "Email Logs",       icon: <Mail size={18} /> },
  { href: "/admin/broadcasts",       label: "Broadcasts",       icon: <Radio size={18} /> },
  { href: "/admin/verifications",    label: "Verifications",    icon: <ShieldCheck size={18} /> },
  { href: "/admin/applications",     label: "Applications",     icon: <ClipboardList size={18} /> },
  { href: "/admin/users",            label: "Users",            icon: <Users size={18} /> },
  { href: "/admin/referrals",        label: "Referrals",        icon: <Gift size={18} /> },
  { href: "/admin/bookings",         label: "Bookings",         icon: <BookOpen size={18} /> },
  { href: "/admin/payments",         label: "Payments",         icon: <CreditCard size={18} /> },
  { href: "/admin/payouts",          label: "Payouts",          icon: <Banknote size={18} /> },
  { href: "/admin/contacts",         label: "Messages",         icon: <MessageSquare size={18} /> },
  { href: "/admin/guarantee-claims", label: "Guarantee Claims", icon: <Shield size={18} /> },
  { href: "/admin/student-ratings",  label: "Student Ratings",  icon: <Star size={18} /> },
  { href: "/admin/blogs",            label: "Blog Posts",       icon: <FileText size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);
  
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <p style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>
          TUTORERA<span style={{ color: '#e94560' }}>®</span>
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.2rem' }}>Admin Panel</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setSidebarOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600', backgroundColor: isActive ? 'rgba(37,99,235,0.3)' : 'transparent', color: isActive ? 'white' : '#9ca3af', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}>
              {item.icon} {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button onClick={async () => { await logout(); router.replace("/"); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.5rem', width: '100%', border: 'none', background: 'none', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>

        {/* Desktop Sidebar */}
        <div style={{ width: '240px', backgroundColor: C.primary, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }} className="admin-sidebar-desktop">
          <SidebarContent />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation menu"
          >
            <div style={{ width: '240px', backgroundColor: C.primary, display: 'flex', flexDirection: 'column', height: '100vh' }}>
              <SidebarContent />
            </div>
            <div
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Main Content */}
        <div style={{ marginLeft: '240px', flex: 1, overflow: 'auto' }} className="admin-main">

          {/* Mobile Header */}
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="admin-mobile-header">
            <button title="Open sidebar" onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary }}>
              <Menu size={24} />
            </button>
            <p style={{ fontWeight: '800', color: C.primary, fontSize: '1rem' }}>
              TUTORERA<span style={{ color: '#e94560' }}>®</span> Admin
            </p>
          </div>

          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .admin-mobile-header { display: none !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-main {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
        }
      `}</style>
    </AdminGuard>
  );
}
