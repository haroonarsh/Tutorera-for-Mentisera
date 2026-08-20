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
  plan: string;
  city: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

const planColors: Record<string, { bg: string; color: string }> = {
  free:     { bg: '#f3f4f6', color: '#6b7280' },
  standard: { bg: '#eff6ff', color: '#2563eb' },
  premium:  { bg: '#fdf4ff', color: '#9333ea' },
};

const roleColors: Record<string, { bg: string; color: string }> = {
  student: { bg: '#eff6ff', color: '#2563eb' },
  tutor:   { bg: '#f0fdf4', color: '#16a34a' },
  admin:   { bg: '#f5f3ff', color: '#7c3aed' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState<string | null>(null);
  const [planDropdown, setPlanDropdown] = useState<string | null>(null); // userId with open dropdown
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchUsers = (page: number = 1, searchTerm: string = search, role: string = roleFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (role !== "all") params.set("role", role);
    api.get(`/admin/users?${params.toString()}`)
      .then(res => {
        setUsers(res.data.users);
        setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(1); }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1, search, roleFilter), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Immediate refetch on role filter change
  useEffect(() => {
    fetchUsers(1, search, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

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

  const handleChangePlan = async (userId: string, plan: string) => {
    setPlanLoading(userId);
    setPlanDropdown(null);
    try {
      await api.patch(`/admin/users/${userId}/plan`, { plan });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, plan } : u));
    } catch {
      alert("Failed to update plan.");
    } finally {
      setPlanLoading(null);
    }
  };

  // const filtered = users.filter(u => {
  //   const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
  //     u.email.toLowerCase().includes(search.toLowerCase());
  //   const matchRole = roleFilter === "all" || u.role === roleFilter;
  //   return matchSearch && matchRole;
  // });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Users</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Manage all registered users and their plans.</p>
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

      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'visible' }}>

        {/* Desktop Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 0.8fr 0.8fr 0.8fr 1.2fr 1fr', padding: '0.75rem 1.5rem', backgroundColor: C.gray50, borderBottom: '1px solid #e5e7eb' }} className="admin-table-header">
          {["Name", "Email", "Role", "Plan", "City", "Status", "Actions"].map(h => (
            <p key={h} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray500 }}>No users found.</div>
        ) : (
          users.map((user, idx) => (
            <div key={user._id} style={{ borderBottom: idx < users.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

              {/* Desktop Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 0.8fr 0.8fr 0.8fr 1.2fr 1fr', padding: '1rem 1.5rem', alignItems: 'center' }} className="admin-table-row">

                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>
                    {user.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary }}>{user.name}</span>
                </div>

                {/* Email */}
                <span style={{ fontSize: '0.8rem', color: C.gray500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>

                {/* Role */}
                <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: roleColors[user.role]?.bg, color: roleColors[user.role]?.color, textTransform: 'capitalize', width: 'fit-content' }}>
                  {user.role}
                </span>

                {/* Plan — click to change */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setPlanDropdown(planDropdown === user._id ? null : user._id)}
                    disabled={planLoading === user._id}
                    style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: planColors[user.plan]?.bg || '#f3f4f6', color: planColors[user.plan]?.color || '#6b7280', textTransform: 'capitalize', border: '1px dashed currentColor', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {planLoading === user._id ? '...' : user.plan || 'free'}
                    <span style={{ fontSize: '0.6rem' }}>▾</span>
                  </button>

                  {/* Plan Dropdown */}
                  {planDropdown === user._id && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '110px', overflow: 'hidden' }}>
                      {["free", "standard", "premium"].map(plan => (
                        <button key={plan}
                          onClick={() => handleChangePlan(user._id, plan)}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.875rem', fontSize: '0.8rem', fontWeight: user.plan === plan ? '700' : '500', color: user.plan === plan ? C.accent : C.primary, backgroundColor: user.plan === plan ? '#eff6ff' : 'transparent', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
                          {plan} {user.plan === plan && '✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* City */}
                <span style={{ fontSize: '0.8rem', color: C.gray500 }}>{user.city || "—"}</span>

                {/* Status */}
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: user.isActive ? '#16a34a' : '#ef4444' }}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>

                {/* Action */}
                <button onClick={() => handleToggleStatus(user._id)} disabled={actionLoading === user._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', backgroundColor: user.isActive ? '#fef2f2' : '#f0fdf4', color: user.isActive ? '#ef4444' : '#16a34a', width: 'fit-content' }}>
                  {user.isActive ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
                </button>
              </div>

              {/* Mobile Card */}
              <div style={{ padding: '1rem 1.25rem' }} className="admin-mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '38px', height: '38px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem', fontWeight: '700', flexShrink: 0 }}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.9rem', margin: 0 }}>{user.name}</p>
                      <p style={{ color: C.gray500, fontSize: '0.75rem', margin: 0 }}>{user.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '999px', backgroundColor: roleColors[user.role]?.bg, color: roleColors[user.role]?.color, textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '999px', backgroundColor: planColors[user.plan]?.bg || '#f3f4f6', color: planColors[user.plan]?.color || '#6b7280', textTransform: 'capitalize' }}>
                      {user.plan || 'free'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: C.gray500 }}>{user.city || "No city"}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: user.isActive ? '#16a34a' : '#ef4444' }}>
                      • {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Mobile plan change */}
                    <select
                      title="Change Plan"
                      value={user.plan || 'free'}
                      onChange={e => handleChangePlan(user._id, e.target.value)}
                      disabled={planLoading === user._id}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.4rem', cursor: 'pointer', color: C.primary, backgroundColor: 'white' }}>
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                    </select>
                    <button onClick={() => handleToggleStatus(user._id)} disabled={actionLoading === user._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', backgroundColor: user.isActive ? '#fef2f2' : '#f0fdf4', color: user.isActive ? '#ef4444' : '#16a34a' }}>
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {!loading && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button onClick={() => fetchUsers(pagination.page - 1, search, roleFilter)} disabled={pagination.page <= 1}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', backgroundColor: 'white', color: pagination.page <= 1 ? '#d1d5db' : C.primary, fontWeight: '600', fontSize: '0.85rem', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}>
            ← Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.85rem', color: C.gray500, fontWeight: '600' }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button onClick={() => fetchUsers(pagination.page + 1, search, roleFilter)} disabled={pagination.page >= pagination.pages}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', backgroundColor: 'white', color: pagination.page >= pagination.pages ? '#d1d5db' : C.primary, fontWeight: '600', fontSize: '0.85rem', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}>
            Next →
          </button>
        </div>
      )}
      <style>{`
        @media (min-width: 769px) { .admin-mobile-card { display: none !important; } }
        @media (max-width: 768px) {
          .admin-table-header { display: none !important; }
          .admin-table-row { display: none !important; }
          .admin-mobile-card { display: block !important; }
        }
      `}</style>
    </div>
  );
}