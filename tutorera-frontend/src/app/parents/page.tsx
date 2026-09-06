"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ArrowLeft, RefreshCw, BookOpen, Calendar, Mail, UserPlus, UserMinus } from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";

interface ChildProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  isMinor: boolean;
  upcomingBookings: number;
  activeRequests: number;
  recentBookings: {
    _id: string;
    subject: string;
    tutorName: string;
    status: string;
    createdAt: string;
  }[];
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linking, setLinking] = useState(false);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await api.get("/parent/children");
      setChildren(res.data.children || []);
    } catch (err) {
      console.error("Failed to load children:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail.trim()) return;
    setLinking(true);
    try {
      await api.post("/parent/link-child", { childEmail: linkEmail, childName: linkName });
      showSuccess("Child account linked successfully");
      setLinkEmail("");
      setLinkName("");
      fetchChildren();
    } catch (err: any) {
      showError(err, err?.response?.data?.message || "Failed to link child");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkChild = async (childId: string) => {
    if (!confirm("Are you sure you want to unlink this child account?")) return;
    try {
      await api.delete(`/parent/link-child/${childId}`);
      showSuccess("Child account unlinked");
      fetchChildren();
    } catch (err: any) {
      showError(err, "Failed to unlink child");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#021550", margin: 0 }}>Parent Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.2rem 0 0" }}>
          Manage and monitor your children&apos;s tutoring activity.
        </p>
      </div>

      {/* Link Child Form */}
      <div style={{ backgroundColor: "white", borderRadius: "0.875rem", padding: "1.5rem", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#021550", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserPlus size={18} color="#0329B2" /> Link Child Account
        </h2>
        <form onSubmit={handleLinkChild} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="email"
            value={linkEmail}
            onChange={(e) => setLinkEmail(e.target.value)}
            placeholder="Child's email address"
            required
            style={{ flex: "1 1 200px", padding: "0.6rem 1rem", border: "1.5px solid #cbd5e1", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none" }}
          />
          <input
            type="text"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Child's name (optional)"
            style={{ flex: "1 1 150px", padding: "0.6rem 1rem", border: "1.5px solid #cbd5e1", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none" }}
          />
          <button type="submit" disabled={linking}
            style={{ padding: "0.6rem 1.25rem", backgroundColor: linking ? "#93c5fd" : "#0329B2", color: "white", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 700, cursor: linking ? "not-allowed" : "pointer" }}>
            {linking ? "Linking..." : "Link Account"}
          </button>
        </form>
      </div>

      {/* Children List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #0329B2", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : children.length === 0 ? (
        <div style={{ backgroundColor: "white", borderRadius: "0.875rem", padding: "3rem", textAlign: "center", border: "1px solid #e5e7eb" }}>
          <Users size={40} color="#d1d5db" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "#64748b", fontWeight: 600 }}>No linked children yet</p>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginTop: "0.5rem" }}>Link your child&apos;s account above to monitor their activity.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {children.map((child) => (
            <div key={child._id} style={{ backgroundColor: "white", borderRadius: "0.875rem", padding: "1.5rem", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#021550", margin: "0 0 0.25rem" }}>{child.name}</h3>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>{child.email}</p>
                  {child.isMinor && <span style={{ fontSize: "0.7rem", background: "#fffbeb", color: "#d97706", padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: 700 }}>Minor Account</span>}
                </div>
                <button onClick={() => handleUnlinkChild(child._id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", border: "1px solid #fecaca", borderRadius: "0.5rem", background: "white", color: "#ef4444", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  <UserMinus size={14} /> Unlink
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 0.2rem" }}>Upcoming Sessions</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#021550", margin: 0 }}>{child.upcomingBookings}</p>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 0.2rem" }}>Active Requests</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#021550", margin: 0 }}>{child.activeRequests}</p>
                </div>
              </div>

              {child.recentBookings.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem" }}>Recent Bookings</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {child.recentBookings.map((booking) => (
                      <div key={booking._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #e5e7eb", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#021550", margin: 0 }}>{booking.subject}</p>
                          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>with {booking.tutorName}</p>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(booking.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
