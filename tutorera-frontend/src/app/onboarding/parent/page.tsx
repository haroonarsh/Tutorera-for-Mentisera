"use client";

import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { UI_COLORS } from "@/lib/brand";
import { useGeoData } from "@/lib/geoService";
import { Country } from "@/lib/location";
import CountryCitySelector from "@/components/marketplace/CountryCitySelector";

const C = UI_COLORS;

export default function ParentOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const geo = useGeoData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", countryCode: "PK", countryName: "Pakistan", country: undefined as string | undefined,
    city: "", cityRef: undefined as string | undefined, timezone: "Asia/Karachi", preferredLanguage: "en",
    approvalRequiredForBookings: true, notificationsEnabled: true,
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "parent") router.replace("/dashboard");
    if (!loading && user?.role === "parent") {
      const market = geo.countries.find((item) => item.code === user.countryCode);
      setForm((current) => ({ ...current, name: user.name || "", phone: user.phone || "", city: user.city || "", ...(market ? { countryCode: market.code, countryName: market.name, country: market.id, timezone: market.defaultTimezone } : {}) }));
    }
  }, [geo.countries, loading, router, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) { setError("Enter your name to continue."); return; }
    setSaving(true); setError("");
    try {
      await api.post("/parent/onboarding", { ...form, name: form.name.trim(), phone: form.phone.trim() });
      router.replace("/dashboard");
    } catch (caught: unknown) {
      setError((caught as { response?: { data?: { message?: string } } })?.response?.data?.message || "We could not save your parent profile. Please try again.");
    } finally { setSaving(false); }
  };

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: C.primary }}>Loadingâ€¦</main>;

  const input = { width: "100%", minHeight: 46, boxSizing: "border-box" as const, border: "1.5px solid #cbd5e1", borderRadius: "0.6rem", padding: "0.7rem 0.8rem", color: C.primary, fontSize: "1rem" };
  const label = { display: "block", marginBottom: "0.4rem", color: C.primary, fontWeight: 700, fontSize: "0.9rem" };
  return <main style={{ minHeight: "100vh", background: "#f5f7ff", padding: "2rem 1rem" }}>
    <section style={{ width: "min(100%, 640px)", margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "inline-flex", width: 52, height: 52, borderRadius: "1rem", alignItems: "center", justifyContent: "center", background: C.primary, color: "white" }}><Users aria-hidden size={26} /></div>
        <p style={{ color: "#016EF8", fontWeight: 800, letterSpacing: "0.08em", fontSize: "0.78rem", margin: "0.8rem 0 0.25rem" }}>PARENT / GUARDIAN SETUP</p>
        <h1 style={{ color: C.primary, fontSize: "clamp(1.65rem, 5vw, 2.25rem)", margin: 0 }}>Set up your family account</h1>
        <p style={{ color: "#475569", margin: "0.6rem auto 0", maxWidth: 540, lineHeight: 1.55 }}>Choose your local market and account preferences. Student access always requires their explicit consent.</p>
      </header>
      <form onSubmit={submit} style={{ background: "white", border: "1px solid #dbe5f3", boxShadow: "0 14px 40px rgba(2,21,80,.08)", borderRadius: "1rem", padding: "clamp(1.25rem, 4vw, 2rem)", display: "grid", gap: "1.15rem" }}>
        {error && <div role="alert" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.75rem", borderRadius: "0.6rem" }}>{error}</div>}
        <div><label htmlFor="parent-name" style={label}>Your name</label><input id="parent-name" required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={input} /></div>
        <div><label htmlFor="parent-phone" style={label}>Phone number <span style={{ color: "#64748b", fontWeight: 500 }}>(optional)</span></label><input id="parent-phone" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} style={input} /></div>
        <CountryCitySelector countryCode={form.countryCode} city={form.city} countries={geo.countries} showCurrency showTimezone onCountryChange={(country: Country) => setForm({ ...form, countryCode: country.code, countryName: country.name, country: country.id, city: "", cityRef: undefined, timezone: country.defaultTimezone })} onCityChange={(city, cityRef) => setForm({ ...form, city, cityRef })} />
        <fieldset style={{ border: "1px solid #dbe5f3", borderRadius: "0.7rem", padding: "1rem", display: "grid", gap: "0.75rem" }}><legend style={{ color: C.primary, fontWeight: 800, padding: "0 0.35rem" }}>Account preferences</legend>
          <label style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", color: "#334155", lineHeight: 1.45 }}><input type="checkbox" checked={form.approvalRequiredForBookings} onChange={(event) => setForm({ ...form, approvalRequiredForBookings: event.target.checked })} />Require my approval before a linked learner books tuition</label>
          <label style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", color: "#334155", lineHeight: 1.45 }}><input type="checkbox" checked={form.notificationsEnabled} onChange={(event) => setForm({ ...form, notificationsEnabled: event.target.checked })} />Send important booking and safety updates by email</label>
        </fieldset>
        <div style={{ display: "flex", gap: "0.7rem", padding: "0.85rem", background: "#eef5ff", borderRadius: "0.7rem", color: C.primary }}><ShieldCheck aria-hidden size={22} /><span style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>You will link a learner from your dashboard with a time-limited consent code sent to their registered email.</span></div>
        <button type="submit" disabled={saving} style={{ minHeight: 48, border: 0, borderRadius: "0.65rem", background: saving ? "#93c5fd" : "#0329B2", color: "white", fontWeight: 800, fontSize: "1rem", cursor: saving ? "wait" : "pointer" }}>{saving ? "Savingâ€¦" : "Continue to parent dashboard"}</button>
      </form>
    </section>
  </main>;
}
