"use client";

import { UI_COLORS } from "@/lib/brand";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, CheckCircle2, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";

const C = UI_COLORS;

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1.25rem', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 12px 36px rgba(2, 21, 80, 0.08)', border: '1px solid #e2e8f0' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BrandLogo size="lg" />
          <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#021550', marginBottom: '0.4rem', marginTop: '0.75rem' }}>
            Choose Your TUTORERA Journey
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Select how you would like to participate in the marketplace:
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: C.error, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {/* Student Card */}
          <div
            onClick={() => setRole("student")}
            style={{
              padding: '1.25rem',
              borderRadius: '1rem',
              border: role === "student" ? '2px solid #0329b2' : '1px solid #e2e8f0',
              backgroundColor: role === "student" ? '#f0f5ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '0.75rem', backgroundColor: role === "student" ? '#0329b2' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role === "student" ? 'white' : '#64748b', flexShrink: 0 }}>
              <BookOpen size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#021550' }}>I am a Student / Parent</h3>
                {role === "student" && <CheckCircle2 size={20} color="#0329b2" />}
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.825rem', color: '#64748b', lineHeight: 1.4 }}>
                Find verified tutors, post home tuition or online tuition requirements, and set your own budget in PKR or local currency.
              </p>
            </div>
          </div>

          {/* Tutor Card */}
          <div
            onClick={() => setRole("tutor")}
            style={{
              padding: '1.25rem',
              borderRadius: '1rem',
              border: role === "tutor" ? '2px solid #0329b2' : '1px solid #e2e8f0',
              backgroundColor: role === "tutor" ? '#f0f5ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '0.75rem', backgroundColor: role === "tutor" ? '#0329b2' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role === "tutor" ? 'white' : '#64748b', flexShrink: 0 }}>
              <GraduationCap size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#021550' }}>I am a Tutor / Educator</h3>
                {role === "tutor" && <CheckCircle2 size={20} color="#0329b2" />}
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.825rem', color: '#64748b', lineHeight: 1.4 }}>
                Create a verified profile, receive targeted student requirements in your subject & city, and send direct tuition offers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? '#93c5fd' : '#0329b2',
            color: 'white',
            padding: '0.95rem 1.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(3, 41, 178, 0.25)',
          }}
        >
          <span>{loading ? "Setting up profile..." : `Continue as ${role === "tutor" ? "Tutor" : "Student"}`}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}