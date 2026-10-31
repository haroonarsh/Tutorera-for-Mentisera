"use client";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { UI_COLORS } from "@/lib/brand";
import { showError, showSuccess } from "@/lib/toast";
import { BookOpen, HelpCircle, Mail, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const C = UI_COLORS;

const FAQS = [
  { q: "How do I post a tuition request?", a: "Go to Post Requirement in the sidebar, fill in your subject, class level, schedule and budget, then submit. Verified tutors will respond with offers." },
  { q: "When do I pay for sessions?", a: "Payment is only required after you accept a tutor's offer and the booking is confirmed. You are never charged for browsing offers or posting requirements." },
  { q: "What if a session does not happen?", a: "You are protected by the TUTORERA Learner Guarantee. Raise a dispute within 7 days of the scheduled session date and we will investigate and issue a refund if the tutor was at fault." },
  { q: "How do I cancel a booking?", a: "Go to Bookings in the sidebar and click Cancel on the relevant booking. Cancellation policies depend on how close to the session date you cancel — see our Terms." },
  { q: "How does tutor verification work?", a: "Every tutor submits identity, qualification and background documents. Our team reviews these before approving each tutor for the marketplace." },
  { q: "How do tutors receive their payout?", a: "After a session is marked complete, tutor earnings enter a short hold period. Tutors can then request a payout from their Earnings page." },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await api.post("/contact", { topic, message: body, name: user?.name ?? "User", email: user?.email ?? "" });
      showSuccess("Message sent! We aim to respond within 24 hours.");
      setTopic("");
      setBody("");
    } catch {
      showError("Could not send message. Please email us directly at support@tutorera.ac.pk");
    } finally { setBusy(false); }
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: C.primary, margin: "0 0 0.5rem" }}>Help &amp; Support</h1>
        <p style={{ color: "#425575", margin: "0 0 2rem" }}>We're here to help. Browse the FAQs below or send us a message.</p>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: "1.5rem" }}>
          {/* Left: FAQs + contact channels */}
          <div>
            {/* FAQs */}
            <div style={{ background: "white", border: "1px solid #dce5f4", borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 800, color: C.primary, fontSize: "1.1rem", margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HelpCircle size={18} color={C.accent} /> Frequently Asked Questions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {FAQS.map(faq => (
                  <details key={faq.q} style={{ borderBottom: "1px solid #f0f4ff", paddingBottom: "0.75rem" }}>
                    <summary style={{ fontWeight: 700, color: C.primary, fontSize: "0.9rem", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {faq.q}
                      <span style={{ fontSize: "1.1rem", color: C.accent, flexShrink: 0 }}>+</span>
                    </summary>
                    <p style={{ color: "#425575", lineHeight: 1.65, margin: "0.5rem 0 0", fontSize: "0.875rem" }}>{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Other contact channels */}
            <div style={{ background: "white", border: "1px solid #dce5f4", borderRadius: "1rem", padding: "1.5rem" }}>
              <h2 style={{ fontWeight: 800, color: C.primary, fontSize: "1.1rem", margin: "0 0 1rem" }}>Other ways to reach us</h2>
              {[
                { icon: <Mail size={18} color={C.accent} />, label: "Email", value: "support@tutorera.ac.pk", href: "mailto:support@tutorera.ac.pk" },
                { icon: <MessageSquare size={18} color={C.accent} />, label: "Live chat", value: "Available 9am–9pm PKT (Mon–Sat)", href: "/chat" },
                { icon: <Phone size={18} color={C.accent} />, label: "WhatsApp", value: "+92 300 0000000", href: "https://wa.me/923000000000" },
                { icon: <BookOpen size={18} color={C.accent} />, label: "Docs & guides", value: "Student and tutor guidebooks", href: user?.role === "tutor" ? "/tutor/guidebook" : "/student/guidebook" },
              ].map(item => (
                <a key={item.label} href={item.href} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 0", borderBottom: "1px solid #f0f4ff", textDecoration: "none", color: "inherit" }}>
                  <div style={{ width: 36, height: 36, background: "#EEF5FF", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: C.primary, fontSize: "0.875rem", margin: 0 }}>{item.label}</p>
                    <p style={{ color: "#8899bb", fontSize: "0.8rem", margin: 0 }}>{item.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Right: contact form */}
          <div style={{ background: "white", border: "1px solid #dce5f4", borderRadius: "1rem", padding: "1.5rem", height: "fit-content" }}>
            <h2 style={{ fontWeight: 800, color: C.primary, fontSize: "1.1rem", margin: "0 0 1.25rem" }}>Send us a message</h2>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, color: C.primary, fontSize: "0.85rem", marginBottom: "0.35rem" }}>Topic</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  required
                  style={{ width: "100%", border: "1px solid #dce5f4", borderRadius: "0.5rem", padding: "0.65rem 0.75rem", fontSize: "0.875rem", color: topic ? C.primary : "#8899bb" }}
                >
                  <option value="">Select a topic…</option>
                  <option>Booking issue</option>
                  <option>Payment / refund</option>
                  <option>Tutor complaint</option>
                  <option>Account issue</option>
                  <option>Technical problem</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, color: C.primary, fontSize: "0.85rem", marginBottom: "0.35rem" }}>Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  required
                  rows={5}
                  placeholder="Describe your issue or question…"
                  style={{ width: "100%", border: "1px solid #dce5f4", borderRadius: "0.5rem", padding: "0.65rem 0.75rem", fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                style={{ padding: "0.7rem 1.5rem", background: C.accent, color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: busy ? "not-allowed" : "pointer", minHeight: 44 }}
              >
                {busy ? "Sending…" : "Send Message"}
              </button>
            </form>
            <p style={{ fontSize: "0.75rem", color: "#8899bb", marginTop: "0.875rem", textAlign: "center" }}>We aim to respond within 24 hours.</p>
          </div>
        </div>

        {/* Safety link */}
        <div style={{ marginTop: "1.5rem", padding: "1rem 1.5rem", background: "#f5f7ff", borderRadius: "0.75rem", border: "1px solid #dce5f4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <p style={{ margin: 0, color: "#425575", fontSize: "0.875rem" }}>Concerned about safety? Read our safety guidelines.</p>
          <Link href="/safety" style={{ fontWeight: 700, color: C.accent, fontSize: "0.875rem" }}>Safety Centre →</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
