"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', error: '#ef4444' };

export default function SelectRolePage() {
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { selectRole } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await selectRole(role);
      if (role === "tutor") {
        router.push("/onboarding/tutor");
      } else {
        router.push("/onboarding/student");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2.5rem', width: '100%', maxWidth: '440px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <BookOpen size={28} color={C.accent} />
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: C.primary }}>TUTORERA<span style={{ color: '#e94560' }}>®</span></span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: C.primary, marginBottom: '0.3rem' }}>One more step</h1>
          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>How do you want to use TUTORERA?</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: C.error, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '0.625rem', padding: '0.25rem', marginBottom: '1.5rem' }}>
          {(["student", "tutor"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s', backgroundColor: role === r ? 'white' : 'transparent', color: role === r ? C.primary : C.gray500, boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize' }}>
              I'm a {r}
            </button>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', backgroundColor: loading ? '#93c5fd' : C.accent, color: 'white', padding: '0.85rem', borderRadius: '0.5rem', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}