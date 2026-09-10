"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BrandLogo from "@/components/BrandLogo";

function getSafeRedirect(target: string | null): string | null {
  if (!target) return null;
  if (target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/\\")) {
    return target;
  }
  return null;
}

function SelectRoleContent() {
  const { user, selectRole, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<"student" | "tutor" | "parent">("student");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeRedirect = useMemo(() => {
    return getSafeRedirect(searchParams.get("redirect"));
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user && user.role !== "pending") {
      if (safeRedirect) {
        router.replace(safeRedirect);
      } else if (user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, safeRedirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await selectRole(selected);
      router.replace(safeRedirect || "/dashboard");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj?.response?.data?.message || "Failed to set role. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#F5F7FF",
      padding: "2rem",
    }}>
      <div style={{ marginBottom: "2rem" }}>
        <BrandLogo />
      </div>

      <div style={{
        backgroundColor: "white",
        borderRadius: "1.25rem",
        border: "1px solid #e5e7eb",
        padding: "2.5rem",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
          Choose Your Role
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "2rem" }}>
          Select how you want to use TUTORERA. You can update this later from your account settings.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            <button
              type="button"
              onClick={() => setSelected("student")}
              style={{
                padding: "1.25rem",
                border: selected === "student" ? "2px solid #0329B2" : "1.5px solid #e5e7eb",
                borderRadius: "0.75rem",
                background: selected === "student" ? "#EEF5FF" : "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#021550", marginBottom: "0.25rem" }}>
                🎓 I'm a Student
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                I want to browse tutors, post tuition requests, and book sessions.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelected("tutor")}
              style={{
                padding: "1.25rem",
                border: selected === "tutor" ? "2px solid #0329B2" : "1.5px solid #e5e7eb",
                borderRadius: "0.75rem",
                background: selected === "tutor" ? "#EEF5FF" : "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#021550", marginBottom: "0.25rem" }}>
                📚 I'm a Tutor
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                I want to offer tuition, respond to student requests, and grow my teaching business.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelected("parent")}
              style={{
                padding: "1.25rem",
                border: selected === "parent" ? "2px solid #0329B2" : "1.5px solid #e5e7eb",
                borderRadius: "0.75rem",
                background: selected === "parent" ? "#EEF5FF" : "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#021550", marginBottom: "0.25rem" }}>
                👪 I'm a Parent or Guardian
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                I want to find tutors for my children and manage their learning progress.
              </div>
            </button>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "#0329B2",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: submitting || loading ? "not-allowed" : "pointer",
              opacity: submitting || loading ? 0.7 : 1,
            }}
          >
            {submitting || loading ? "Setting up your account..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#F5F7FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #0329B2", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <SelectRoleContent />
    </Suspense>
  );
}
