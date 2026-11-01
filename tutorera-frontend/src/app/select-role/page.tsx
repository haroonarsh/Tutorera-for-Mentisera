"use client";

import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SelectRolePage() {
  const { selectRole, loading } = useAuth();
  const [selected, setSelected] = useState<"student" | "tutor" | "parent">("student");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const router = useRouter();
  const studentAge = dateOfBirth ? (() => { const d = new Date(dateOfBirth + "T00:00:00.000Z"); const now = new Date(); return now.getUTCFullYear() - d.getUTCFullYear() - (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate()) ? 1 : 0); })() : null;
  const needsGuardian = selected === "student" && studentAge !== null && studentAge >= 13 && studentAge < 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const next = await selectRole(selected, selected === "student" ? { dateOfBirth, guardianEmail: needsGuardian ? guardianEmail : undefined, guardianName: needsGuardian ? guardianName : undefined } : undefined);
      router.push(next.isMinor && !next.parentConsentVerified ? "/guardian-consent-pending" : "/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to set role. Please try again.");
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
              onClick={() => setSelected("parent")}
              style={{
                padding: "1.25rem",
                border: selected === "parent" ? "2px solid #0329B2" : "1.5px solid #e5e7eb",
                borderRadius: "0.75rem",
                background: selected === "parent" ? "#EEF5FF" : "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.15s ease, background-color 0.15s ease",
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#021550", marginBottom: "0.25rem" }}>
                👪 I&apos;m a Parent or Guardian
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                I want to manage safe tutoring, bookings, and learning plans for a child.
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
                👨‍👩‍👧 I'm a Parent
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                I want to find tutors for my children and manage their learning progress.
              </div>
            </button>
          </div>

          {selected === "student" && (
            <div style={{ textAlign: "left", marginBottom: "1rem" }}>
              <label htmlFor="role-student-dob" style={{ display: "block", color: "#021550", marginBottom: "0.35rem" }}>Student date of birth</label>
              <input id="role-student-dob" type="date" required value={dateOfBirth} onChange={event => setDateOfBirth(event.target.value)}
                max={new Date().toISOString().slice(0, 10)} style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "0.5rem" }} />
              {studentAge !== null && studentAge < 13 && <p style={{ color: "#991b1b" }}>Children under 13 cannot register independently; contact support.</p>}
              {needsGuardian && (
                <div style={{ marginTop: "0.65rem", display: "grid", gap: "0.6rem" }}>
                  <label htmlFor="role-guardian-name">Guardian name</label>
                  <input id="role-guardian-name" required value={guardianName} onChange={event => setGuardianName(event.target.value)}
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "0.5rem" }}/>
                  <label htmlFor="role-guardian-email">Guardian email (separate from yours)</label>
                  <input id="role-guardian-email" type="email" required value={guardianEmail} onChange={event => setGuardianEmail(event.target.value)}
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "0.5rem" }}/>
                </div>
              )}
            </div>
          )}
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
