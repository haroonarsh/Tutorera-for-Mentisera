"use client";
import { useEffect, useState } from "react";
import { UserCheck, UserX, Search } from "lucide-react";
import api from "@/lib/axios";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  city: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get("/admin/users")
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleStatus = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/users/${id}/status`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch {
      alert("Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColors: Record<string, { bg: string; color: string }> = {
    student: { bg: '#eff6ff', color: '#2563eb' },
    tutor: { bg: '#f0fdf4', color: '#16a34a' },
    admin: { bg: '#f5f3ff', color: '#7c3aed' },
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Users</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Manage all registered users.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} color={C.gray500} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.25rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {["all", "student", "tutor", "admin"].map(role => (
            <button key={role} onClick={() => setRoleFilter(role)}
              style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: roleFilter === role ? 'none' : '1px solid #e5e7eb', backgroundColor: roleFilter === role ? C.primary : 'white', color: roleFilter === role ? 'white' : C.gray500, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize' }}>
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Replace the existing table div with this */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>

      {/* Desktop Table Header — hide on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', padding: '0.75rem 1.5rem', backgroundColor: C.gray50, borderBottom: '1px solid #e5e7eb' }} className="admin-table-header">
        {["Name", "Email", "Role", "City", "Status", "Action"].map(h => (
         <p key={h} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</p>
        ))}
        </div>

        {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
       <div style={{ width: '32px', height: '32px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
         </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray500 }}>No users found.</div>
         ) : (
          filtered.map((user, idx) => (
            <div key={user._id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

              {/* Desktop Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', padding: '1rem 1.5rem', alignItems: 'center' }} className="admin-table-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>
              {user.name.charAt(0)}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary }}>{user.name}</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: C.gray500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: roleColors[user.role]?.bg, color: roleColors[user.role]?.color, textTransform: 'capitalize', width: 'fit-content' }}>{user.role}</span>
          <span style={{ fontSize: '0.8rem', color: C.gray500 }}>{user.city || "—"}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: user.isActive ? '#16a34a' : '#ef4444' }}>
            {user.isActive ? "Active" : "Inactive"}
          </span>
          <button onClick={() => handleToggleStatus(user._id)} disabled={actionLoading === user._id}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', backgroundColor: user.isActive ? '#fef2f2' : '#f0fdf4', color: user.isActive ? '#ef4444' : '#16a34a', width: 'fit-content' }}>
            {user.isActive ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
          </button>
        </div>

        {/* Mobile Card — show on small screens */}
        <div style={{ padding: '1rem 1.25rem' }} className="admin-mobile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '38px', height: '38px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem', fontWeight: '700', flexShrink: 0 }}>
                {user.name.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.9rem' }}>{user.name}</p>
                <p style={{ color: C.gray500, fontSize: '0.75rem' }}>{user.email}</p>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '999px', backgroundColor: roleColors[user.role]?.bg, color: roleColors[user.role]?.color, textTransform: 'capitalize', flexShrink: 0 }}>
              {user.role}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: C.gray500 }}>{user.city || "No city"}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: user.isActive ? '#16a34a' : '#ef4444' }}>
                • {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <button onClick={() => handleToggleStatus(user._id)} disabled={actionLoading === user._id}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', backgroundColor: user.isActive ? '#fef2f2' : '#f0fdf4', color: user.isActive ? '#ef4444' : '#16a34a' }}>
              {user.isActive ? "Deactivate" : "Activate"}
            </button>
               </div>
           </div>

          </div>
       ))
      )}
      </div>

      {/* Add this CSS */}
      <style>{`
        @media (min-width: 769px) {
        .admin-mobile-card { display: none !important; }
          }
         @media (max-width: 768px) {
          .admin-table-header { display: none !important; }
         .admin-table-row { display: none !important; }
           .admin-mobile-card { display: block !important; }
         }
      `}</style>
    </div>
  );
}