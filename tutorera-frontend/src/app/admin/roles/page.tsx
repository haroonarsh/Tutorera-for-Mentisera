"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Users, Key, Search, Edit3, X, Lock } from "lucide-react";
import api from "@/lib/axios";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  adminRole?: string;
  adminPermissions?: string[];
  createdAt: string;
}

interface RolesOverviewData {
  availableRoles: string[];
  allPermissions: string[];
  rolePermissions: Record<string, string[]>;
  adminUsers: AdminUser[];
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Unrestricted platform governance, financial settlement approval, and security controls.",
  marketplace_operations: "Control tower pulse, liquidity balancing, and tuition request interventions.",
  student_success: "Student 360° triage, at-risk tuition demand rescue, and student rating audits.",
  tutor_operations: "Tutor directory, supply gap mitigation, and candidate assignment.",
  verification_officer: "Teacher credential verification, police clearance checks, and KYC audit.",
  trust_and_safety: "Incident case management, harassment investigations, and emergency account bans.",
  finance: "Settlement reconciliation, commission engine config, payout approvals, and chargebacks.",
  support: "Contact ticketing, booking issue resolution, and customer inquiry response.",
  growth: "Referral campaign tracking and platform growth analytics.",
  content: "Blog editorial reviews, public SEO pages, and communication broadcasts.",
  analyst: "Read-only access across marketplace analytics, cohorts, and business intelligence.",
};

export default function AdminRolesPage() {
  const [data, setData] = useState<RolesOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [targetRole, setTargetRole] = useState<string>("marketplace_operations");
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/roles/overview");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load admin roles:", err);
      setStatusMessage({ type: "error", text: "Failed to load admin RBAC data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const openEditModal = (u: AdminUser) => {
    setSelectedUser(u);
    const initialRole = u.adminRole || "super_admin";
    setTargetRole(initialRole);
    setCustomPermissions(u.adminPermissions || data?.rolePermissions[initialRole] || []);
  };

  const handleRoleChange = (newRole: string) => {
    setTargetRole(newRole);
    if (data?.rolePermissions[newRole]) {
      setCustomPermissions([...data.rolePermissions[newRole]]);
    }
  };

  const togglePermission = (perm: string) => {
    setCustomPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSaveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await api.patch(`/admin/roles/users/${selectedUser._id}`, {
        adminRole: targetRole,
        adminPermissions: customPermissions,
      });

      setStatusMessage({ type: "success", text: res.data.message || "Admin role updated successfully." });
      setSelectedUser(null);
      await fetchOverview();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Failed to update admin role:", err);
      setStatusMessage({ type: "error", text: error.response?.data?.message || "Failed to update role." });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = (data?.adminUsers || []).filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.adminRole || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "1.75rem 2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/admin" style={{ color: TEXT_COLORS.muted, textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <ArrowLeft size={14} /> Control Tower
            </Link>
            <span style={{ color: UI_COLORS.border }}>/</span>
            <span style={{ color: TEXT_COLORS.muted, fontSize: "0.85rem" }}>System Governance</span>
            <span style={{ color: UI_COLORS.border }}>/</span>
            <span style={{ color: TEXT_COLORS.body, fontSize: "0.85rem", fontWeight: 600 }}>Roles & RBAC</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: TEXT_COLORS.body, margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Key size={26} color={UI_COLORS.accent} /> Role-Based Access Control (RBAC) Console
          </h1>
          <p style={{ color: TEXT_COLORS.muted, margin: "0.25rem 0 0", fontSize: "0.88rem" }}>
            Enforce least-privilege security across 11 functional domains: Control Tower, Finance, T&S, Tutor Ops, and Student Success.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.55rem 0.95rem",
            background: UI_COLORS.surface,
            border: `1px solid ${UI_COLORS.border}`,
            borderRadius: "7px",
            color: TEXT_COLORS.secondary,
            fontSize: "0.83rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "0.9rem 1.25rem",
            background: statusMessage.type === "success" ? STATUS_COLORS.success.bg : STATUS_COLORS.danger.bg,
            border: `1px solid ${statusMessage.type === "success" ? STATUS_COLORS.success.border : STATUS_COLORS.danger.border}`,
            borderRadius: "8px",
            color: statusMessage.type === "success" ? STATUS_COLORS.success.color : STATUS_COLORS.danger.color,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.88rem",
          }}
        >
          {statusMessage.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {statusMessage.text}
        </div>
      )}

      {/* Admin Users Roster */}
      <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "10px", overflow: "hidden", marginBottom: "2rem", boxShadow: UI_COLORS.shadowCard }}>
        <div style={{ padding: "1.1rem 1.25rem", borderBottom: `1px solid ${STATUS_COLORS.neutral.bg}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} color={UI_COLORS.accent} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: TEXT_COLORS.body, margin: 0 }}>
              Authorized Admin Personnel ({filteredUsers.length})
            </h2>
          </div>

          <div style={{ position: "relative", minWidth: "240px" }}>
            <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: TEXT_COLORS.muted }} />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "0.45rem 0.75rem 0.45rem 2.2rem", border: `1px solid ${UI_COLORS.border}`, borderRadius: "6px", fontSize: "0.83rem" }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: STATUS_COLORS.neutral.bg, borderBottom: `1px solid ${UI_COLORS.border}`, color: TEXT_COLORS.muted }}>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Team Member</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Assigned Role</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Role Scope</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Active Permissions</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: TEXT_COLORS.muted }}>
                    No administrative personnel match your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const role = user.adminRole || "super_admin";
                  const permCount = user.adminPermissions?.length ?? (data?.rolePermissions[role]?.length || 0);

                  return (
                    <tr key={user._id} style={{ borderBottom: `1px solid ${STATUS_COLORS.neutral.bg}` }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: TEXT_COLORS.body }}>{user.name}</div>
                        <div style={{ fontSize: "0.78rem", color: TEXT_COLORS.muted }}>{user.email}</div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            background: role === "super_admin" ? UI_COLORS.accentLight : STATUS_COLORS.neutral.bg,
                            color: role === "super_admin" ? STATUS_COLORS.info.color : TEXT_COLORS.secondary,
                            border: `1px solid ${role === "super_admin" ? STATUS_COLORS.info.border : UI_COLORS.border}`,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: TEXT_COLORS.muted, maxWidth: "280px", fontSize: "0.8rem" }}>
                        {ROLE_DESCRIPTIONS[role] || "Custom scoped permissions."}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ background: STATUS_COLORS.success.bg, color: STATUS_COLORS.success.color, padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                          {permCount} capabilities
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <button
                          onClick={() => openEditModal(user)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.35rem 0.75rem",
                            background: UI_COLORS.accent,
                            color: UI_COLORS.surface,
                            border: "none",
                            borderRadius: "5px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Edit3 size={12} /> Change Role
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Catalog Cards */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT_COLORS.body, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ShieldCheck size={20} color={STATUS_COLORS.success.color} /> Pre-Configured Role Matrix
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {data?.availableRoles.map((role) => {
          const perms = data.rolePermissions[role] || [];
          return (
            <div
              key={role}
              style={{
                background: UI_COLORS.surface,
                border: `1px solid ${UI_COLORS.border}`,
                borderRadius: "8px",
                padding: "1rem",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT_COLORS.body, textTransform: "uppercase" }}>
                  {role.replace(/_/g, " ")}
                </span>
                <span style={{ fontSize: "0.72rem", background: UI_COLORS.accentLight, color: STATUS_COLORS.info.color, padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: 600 }}>
                  {perms.length} perms
                </span>
              </div>
              <p style={{ fontSize: "0.78rem", color: TEXT_COLORS.muted, margin: "0 0 0.6rem", lineHeight: 1.4 }}>
                {ROLE_DESCRIPTIONS[role] || "Functional domain operator role."}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", maxHeight: "80px", overflowY: "auto" }}>
                {perms.map((p) => (
                  <span key={p} style={{ background: STATUS_COLORS.neutral.bg, color: TEXT_COLORS.muted, border: `1px solid ${UI_COLORS.border}`, fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "3px" }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Assignment Modal */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: UI_COLORS.surface,
              borderRadius: "12px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: TEXT_COLORS.body, margin: 0 }}>
                  Assign Role to {selectedUser.name}
                </h2>
                <span style={{ fontSize: "0.78rem", color: TEXT_COLORS.muted }}>{selectedUser.email}</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_COLORS.muted }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUserRole}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: TEXT_COLORS.secondary, marginBottom: "0.35rem" }}>
                  Select Operating Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", border: `1px solid ${UI_COLORS.border}`, borderRadius: "6px", fontSize: "0.9rem" }}
                >
                  {data?.availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ").toUpperCase()} — {ROLE_DESCRIPTIONS[r] || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: TEXT_COLORS.secondary }}>
                    Granted Granular Permissions ({customPermissions.length})
                  </label>
                  <span style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted }}>Click checkbox to toggle fine-grained overrides</span>
                </div>

                <div
                  style={{
                    border: `1px solid ${UI_COLORS.border}`,
                    borderRadius: "8px",
                    padding: "0.75rem",
                    maxHeight: "220px",
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.4rem",
                    background: STATUS_COLORS.neutral.bg,
                  }}
                >
                  {data?.allPermissions.map((perm) => (
                    <label key={perm} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: TEXT_COLORS.secondary, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={customPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                      />
                      <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  style={{ padding: "0.55rem 1rem", background: STATUS_COLORS.neutral.bg, border: `1px solid ${UI_COLORS.border}`, borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1.25rem",
                    background: UI_COLORS.accent,
                    color: UI_COLORS.surface,
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Lock size={14} /> {saving ? "Saving Changes..." : "Enforce Role Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
