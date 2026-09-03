"use client";
import { UI_COLORS } from "@/lib/brand";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import GoogleButton from "@/components/GoogleButton";
import api from "@/lib/axios";
import { Suspense } from "react";

const C = UI_COLORS;

const cities = ["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar", "Quetta", "Multan", "Faisalabad"];

function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" as "student" | "tutor", phone: "", city: "" });
  const [referralCode, setReferralCode] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralMsg, setReferralMsg] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

    // Auto-fill referral code from URL ?ref=CODE
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
    await register(form);

    // Apply referral code after registration if provided
      if (referralCode.trim()) {
        try {
          const res = await api.post("/referral/apply", { code: referralCode.trim() });
          setReferralMsg(res.data.message);
        } catch {
          // Referral code invalid — don't block registration, just ignore
        }
      }

    // Redirect based on role
    if (form.role === "tutor") {
      router.push("/onboarding/tutor");
    } else {
      router.push("/onboarding/student");
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    setError(error.response?.data?.message || "Registration failed. Please try again.");
  } finally {
    setLoading(false);
  }
  };
  
  const handleGoogleToken = async (idToken: string) => {
    setError("");
    try {
      const { user, needsRole } = await loginWithGoogle(idToken);
      if (needsRole) {
        router.push("/select-role");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Google sign-in failed. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BrandLogo size="lg" /><h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: C.primary, marginBottom: '0.3rem' }}>Create your account</h1>
          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Join Pakistan's tutoring marketplace</p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '0.625rem', padding: '0.25rem', marginBottom: '1.5rem' }}>
          {(["student", "tutor"] as const).map((role) => (
            <button key={role} type="button" onClick={() => setForm({ ...form, role })}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s', backgroundColor: form.role === role ? 'white' : 'transparent', color: form.role === role ? C.primary : C.gray500, boxShadow: form.role === role ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize' }}>
              I'm a {role}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: C.error, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Full Name</label>
            <input name="name" type="text" value={form.name} onChange={handleChange} required placeholder="Muhammad Ahmad"
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
              onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Email address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com"
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
              onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
          </div>

          {/* Phone + City */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Phone</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="03001234567"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>City</label>
              {/* Free-text input with autocomplete suggestions from the
                  common-cities list, instead of a locked <select> — the
                  student can type any city, including ones not listed. */}
              <input
                name="city"
                type="text"
                list="city-suggestions"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Islamabad"
                autoComplete="off"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: form.city ? C.primary : C.gray500, backgroundColor: 'white' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
              <datalist id="city-suggestions">
                {cities.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange} required placeholder="Min. 6 characters"
                style={{ width: '100%', padding: '0.75rem 2.75rem 0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.gray500 }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* ── Referral Code ── */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>
              Referral Code <span style={{ color: C.gray500, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. AHMAD3F2A"
              maxLength={12}
              style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${referralApplied ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, letterSpacing: '0.05em', fontWeight: 600 }}
              onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = referralApplied ? '#bbf7d0' : '#e5e7eb')} />
            {referralCode && (
              <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.3rem', fontWeight: 600 }}>
                🎁 You'll get Rs. 200 credit on your first booking!
              </p>
            )}
          </div>

          <button type="submit" disabled={loading}
            style={{ backgroundColor: loading ? '#93c5fd' : C.accent, color: 'white', padding: '0.85rem', borderRadius: '0.5rem', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem' }}>
            {loading ? "Creating account..." : `Create ${form.role} account`}
          </button>
        </form>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          <span style={{ fontSize: '0.8rem', color: C.gray500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
        </div>

        <GoogleButton onToken={handleGoogleToken} text="signin_with" />

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: C.gray500 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: C.accent, fontWeight: '600', textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}