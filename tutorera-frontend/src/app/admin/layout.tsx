"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";

const C = { primary: '#1a1a2e', accent: '#2563eb' };

const navItems = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/verifications", label: "Verifications", icon: <ShieldCheck size={18} /> },
  { href: "/admin/users", label: "Users", icon: <Users size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>

        {/* Sidebar */}
        <div style={{ width: '240px', backgroundColor: C.primary, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>
          {/* Logo */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>
              TUTORERA<span style={{ color: '#e94560' }}>®</span>
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.2rem' }}>Admin Panel</p>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600', backgroundColor: pathname === item.href ? 'rgba(37,99,235,0.3)' : 'transparent', color: pathname === item.href ? 'white' : '#9ca3af', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (pathname !== item.href) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (pathname !== item.href) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => { logout(); router.push("/"); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.5rem', width: '100%', border: 'none', background: 'none', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ marginLeft: '240px', flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}