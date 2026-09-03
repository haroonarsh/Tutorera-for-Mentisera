"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GoogleButton from "@/components/GoogleButton";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', error: '#ef4444' };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
        if (loggedInUser.role === "admin") {
          router.replace("/admin");
        } else if (loggedInUser.role === "pending") {
          router.replace("/select-role");
        } else {
          router.replace("/dashboard");
        }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = async (idToken: string) => {
    setError("");
    try {
      const { user, needsRole } = await loginWithGoogle(idToken);
      if (needsRole) {
        router.replace("/select-role");
      } else if (user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Google sign-in failed. Please try again.");
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: C.primary, marginBottom: '0.3rem' }}>Welcome back</h1>
          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Log in to your account</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: C.error, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Email address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
              onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: C.accent, textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 2.75rem 0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.gray500 }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ backgroundColor: loading ? '#93c5fd' : C.accent, color: 'white', padding: '0.85rem', borderRadius: '0.5rem', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          <span style={{ fontSize: '0.8rem', color: C.gray500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
        </div>

        <GoogleButton onToken={handleGoogleToken} text="signin_with" />

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: C.gray500 }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: C.accent, fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
