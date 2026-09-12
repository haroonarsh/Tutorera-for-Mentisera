"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { UI_COLORS } from "@/lib/brand";

const C = UI_COLORS;

const guidebookSections = [
  { id: "intro", title: "Introduction", anchor: "introduction" },
  { id: "getting-started", title: "1. Getting Started", anchor: "getting-started" },
  { id: "dashboard", title: "2. Your Student Dashboard", anchor: "dashboard" },
  { id: "how-it-works", title: "3. How TUTORERA Works", anchor: "how-it-works" },
  { id: "post-request", title: "4. Posting a Tuition Request", anchor: "post-request" },
  { id: "understand-offers", title: "5. Understanding Tutor Offers", anchor: "understand-offers" },
  { id: "offers-counter", title: "6. Offers and Counter-Offers", anchor: "offers-counter" },
  { id: "communication", title: "7. Communicating With Tutors", anchor: "communication" },
  { id: "choose-tutor", title: "8. Choosing a Tutor", anchor: "choose-tutor" },
  { id: "verification", title: "9. Understanding Tutor Verification", anchor: "verification" },
  { id: "online-tuition", title: "10. Online Tuition", anchor: "online-tuition" },
  { id: "home-tuition", title: "11. Home Tuition / In-Person Tuition", anchor: "home-tuition" },
  { id: "home-distance", title: "12. Home Tuition Distance", anchor: "home-distance" },
  { id: "booking", title: "13. Booking a Tutor", anchor: "booking" },
  { id: "fees", title: "14. Student Fees", anchor: "fees" },
  { id: "payments", title: "15. Payments", anchor: "payments" },
  { id: "failed-payments", title: "16. Failed or Pending Payments", anchor: "failed-payments" },
  { id: "cancel-booking", title: "17. Cancelling a Booking", anchor: "cancel-booking" },
  { id: "refunds", title: "18. Refunds", anchor: "refunds" },
  { id: "tutor-no-show", title: "19. If the Tutor Does Not Arrive", anchor: "tutor-no-show" },
  { id: "not-satisfied", title: "20. If You Are Not Satisfied", anchor: "not-satisfied" },
  { id: "reviews", title: "21. Reviews and Ratings", anchor: "reviews" },
  { id: "safety", title: "22. Safety and Inappropriate Conduct", anchor: "safety" },
  { id: "account-protection", title: "23. Protecting Your Account", anchor: "account-protection" },
  { id: "notifications", title: "24. Notifications", anchor: "notifications" },
  { id: "request-expiry", title: "25. Request Expiry", anchor: "request-expiry" },
  { id: "common-problems", title: "26. Common Problems", anchor: "common-problems" },
  { id: "contact-support", title: "27. Contacting TUTORERA", anchor: "contact-support" },
  { id: "checklist", title: "28. Recommended Student Checklist", anchor: "checklist" },
  { id: "remember", title: "29. Remember", anchor: "remember" },
];

export default function GuidebookPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("introduction");
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1) || "introduction";
    setActiveSection(hash);
    const element = document.getElementById(hash);
    if (element) {
      setTimeout(() => element.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const handleSectionClick = (anchor: string) => {
    setActiveSection(anchor);
    window.location.hash = anchor;
    const element = document.getElementById(anchor);
    if (element) {
      setTimeout(() => element.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 50,
          padding: "0.5rem",
          background: C.primary,
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
          display: "none",
        }}
        className="mobile-toggle"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? "280px" : "0",
          transition: "width 0.3s ease",
          background: "white",
          borderRight: "1px solid #e5e7eb",
          overflowY: "auto",
          overflowX: "hidden",
          position: "sticky",
          top: 0,
          height: "100vh",
          padding: sidebarOpen ? "2rem 0" : "0",
          zIndex: 40,
        }}
      >
        {sidebarOpen && (
          <nav style={{ padding: "0 1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "700", color: C.primary, marginBottom: "1.5rem", padding: "0 0.5rem" }}>
              📚 Table of Contents
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {guidebookSections.map((section) => (
                <li key={section.id} style={{ marginBottom: "0.5rem" }}>
                  <button
                    onClick={() => handleSectionClick(section.anchor)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.75rem 1rem",
                      border: "none",
                      background: activeSection === section.anchor ? `${C.primary}15` : "transparent",
                      color: activeSection === section.anchor ? C.primary : "#6b7280",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: activeSection === section.anchor ? "600" : "400",
                      borderLeft: activeSection === section.anchor ? `3px solid ${C.primary}` : "3px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background =
                        activeSection === section.anchor ? `${C.primary}15` : "transparent";
                    }}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        <article style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
          {/* Header */}
          <section
            id="introduction"
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "0.75rem",
              marginBottom: "2rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: C.primary, marginBottom: "1rem" }}>
              📖 TUTORERA Student & Parent Guidebook
            </h1>
            <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: "1.6", marginBottom: "1rem" }}>
              Your complete guide to finding, comparing, hiring and learning with tutors on TUTORERA.
            </p>
            <p style={{ fontSize: "0.95rem", color: "#9ca3af", lineHeight: "1.6" }}>
              TUTORERA is a student-led tutoring marketplace operated by MENTISERA. Instead of forcing students to choose from a static tutor directory, TUTORERA allows students and parents to describe what they need, propose a budget, receive offers from suitable tutors, compare those offers, communicate through the platform and select the tutor they prefer.
            </p>
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f0fdf4", borderRadius: "0.5rem", borderLeft: "4px solid #16a34a" }}>
              <strong style={{ color: "#15803d" }}>✓ TUTORERA supports:</strong>
              <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", color: "#166534" }}>
                <li>Online tutoring across supported international markets</li>
                <li>Local Home Tuition and in-person tutoring</li>
                <li>Secure communication and verified tutors</li>
                <li>Payment records and dispute support</li>
              </ul>
            </div>
          </section>

          {/* Section 1 */}
          <section id="getting-started" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              1. Getting Started
            </h2>
            <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "1rem" }}>
              After creating your TUTORERA account, complete your basic profile before requesting tuition.
            </p>
            <div style={{ background: "white", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <strong style={{ color: C.primary }}>You may be asked for:</strong>
              <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", color: "#6b7280" }}>
                <li>Full name</li>
                <li>Email address</li>
                <li>Mobile number</li>
                <li>Country, State, City</li>
                <li>Preferred currency and timezone</li>
                <li>Student level and preferred subjects</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section id="dashboard" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              2. Your Student Dashboard
            </h2>
            <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "1rem" }}>
              Your dashboard acts as your main control centre. You may see sections including:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                { icon: "🔍", title: "Find Tutors", desc: "Search and compare available tutors" },
                { icon: "📝", title: "Post Request", desc: "Tell tutors what you need" },
                { icon: "💬", title: "Messages", desc: "Communicate with tutors" },
                { icon: "📚", title: "My Requests", desc: "Track active and completed requests" },
                { icon: "✉️", title: "Offers", desc: "Review tutor proposals" },
                { icon: "📅", title: "Bookings", desc: "View upcoming and past sessions" },
              ].map((item) => (
                <div key={item.title} style={{ background: "#f9fafb", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{item.icon}</div>
                  <strong style={{ color: C.primary, display: "block", marginBottom: "0.25rem" }}>{item.title}</strong>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section id="how-it-works" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              3. How TUTORERA Works
            </h2>
            <div style={{ background: `${C.primary}10`, padding: "1.5rem", borderRadius: "0.5rem", border: `1px solid ${C.primary}30` }}>
              <p style={{ color: "#1f2937", fontSize: "1.05rem", fontWeight: "600", margin: "0 0 1rem 0" }}>
                The normal student journey is:
              </p>
              <div style={{ background: "white", padding: "1rem", borderRadius: "0.375rem", fontFamily: "monospace", fontSize: "0.95rem", color: C.primary, overflowX: "auto" }}>
                Need Tutor → Post Requirement → Set Budget → Receive Offers → Compare Tutors → Communicate → Choose Tutor → Accept Final Price → Booking Created → Payment → Learn → Review
              </div>
              <p style={{ color: "#6b7280", marginTop: "1rem", fontSize: "0.95rem" }}>
                ✓ You do not need to pay merely to post a tuition request.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="post-request" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              4. Posting a Tuition Request
            </h2>
            <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "1rem" }}>
              Select <strong>Post Tuition Request</strong> and provide accurate information so the right tutors can respond.
            </p>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "grid", gap: "1rem" }}>
                {[
                  { label: "Subject", examples: "Mathematics, Physics, Chemistry, English, Computer Science..." },
                  { label: "Student Level", examples: "Primary, Secondary, Matric, FSc, O Level, A Level, University..." },
                  { label: "Curriculum", examples: "Cambridge, IB, GCSE, IGCSE, or local curriculum" },
                  { label: "Learning Goal", examples: "Concept clarification, Exam prep, Homework support..." },
                  { label: "Tuition Mode", examples: "Online Tuition or Home/In-Person Tuition" },
                  { label: "Schedule", examples: "Your preferred days and times" },
                  { label: "Budget", examples: "Your proposed tutoring cost (tutors can counter-offer)" },
                ].map((item) => (
                  <div key={item.label}>
                    <strong style={{ color: C.primary, display: "block", marginBottom: "0.25rem" }}>{item.label}</strong>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{item.examples}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Add more sections... */}
          <section id="understand-offers" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              5. Understanding Tutor Offers
            </h2>
            <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "1rem" }}>
              Once your requirement is available, tutors may submit offers. Do not automatically choose the cheapest tutor.
            </p>
            <div style={{ background: "#fef3c7", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fcd34d", marginBottom: "1rem" }}>
              <strong style={{ color: "#92400e" }}>⚠️ Consider:</strong>
              <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", color: "#854d0e" }}>
                <li>Subject knowledge and qualifications</li>
                <li>Relevant experience</li>
                <li>Verification and reviews</li>
                <li>Availability and teaching approach</li>
                <li>Budget alignment and location</li>
              </ul>
            </div>
          </section>

          {/* Safety Section */}
          <section id="safety" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              22. Safety and Inappropriate Conduct
            </h2>
            <div style={{ background: "#fee2e2", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
              <strong style={{ color: "#991b1b", display: "block", marginBottom: "0.5rem" }}>⛔ Immediately report:</strong>
              <ul style={{ margin: "0 0 0 0", paddingLeft: "1.5rem", color: "#b91c1c" }}>
                <li>Harassment, sexual misconduct, or threats</li>
                <li>Fraud or suspicious payment requests</li>
                <li>Attempts to obtain sensitive information</li>
                <li>Identity concerns or dangerous behaviour</li>
              </ul>
              <p style={{ color: "#991b1b", marginTop: "1rem", fontSize: "0.95rem" }}>
                Contact: <strong>hello@mentisera.pk</strong>
              </p>
            </div>
          </section>

          {/* Checklist Section */}
          <section id="checklist" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              28. Recommended Student Checklist
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#15803d", display: "block", marginBottom: "0.75rem" }}>✓ Before Hiring:</strong>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#166534", fontSize: "0.875rem" }}>
                  <li>Requirement is accurate</li>
                  <li>Tutor profile reviewed</li>
                  <li>Verification checked</li>
                  <li>Qualifications reviewed</li>
                  <li>Reviews considered</li>
                  <li>Price confirmed</li>
                </ul>
              </div>
              <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe" }}>
                <strong style={{ color: "#0c4a6e", display: "block", marginBottom: "0.75rem" }}>✓ Before Each Session:</strong>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#164e63", fontSize: "0.875rem" }}>
                  <li>Date/time verified</li>
                  <li>Learning material ready</li>
                  <li>Internet tested (online)</li>
                  <li>Guardian available (minors)</li>
                  <li>Messages checked</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section id="contact-support" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
              27. Contacting TUTORERA
            </h2>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", border: "2px solid #3b82f6" }}>
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: "600", margin: 0 }}>📧 Email Support</p>
                <p style={{ fontSize: "1.3rem", color: C.primary, fontWeight: "700", margin: "0.5rem 0 0 0" }}>
                  <a href="mailto:hello@mentisera.pk" style={{ color: C.primary, textDecoration: "none" }}>
                    hello@mentisera.pk
                  </a>
                </p>
              </div>
              <p style={{ color: "#6b7280", fontSize: "0.95rem", textAlign: "center" }}>
                Use support for account, booking, payment issues, refund requests, complaints, or security concerns.
              </p>
            </div>
          </section>

          {/* Footer */}
          <section id="remember" style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "2px solid #e5e7eb" }}>
            <div style={{ background: `${C.primary}15`, padding: "2rem", borderRadius: "0.75rem", textAlign: "center" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: C.primary, marginBottom: "1rem" }}>
                Remember
              </h2>
              <p style={{ fontSize: "1.05rem", color: "#374151", lineHeight: "1.8", maxWidth: "700px", margin: "0 auto" }}>
                TUTORERA gives students and parents <strong>choice</strong>. You define your learning requirement. Tutors compete to provide suitable offers. You compare them. You choose. <strong>You remain in control</strong> of your tutoring decision.
              </p>
            </div>
          </section>

          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            style={{
              position: "fixed",
              bottom: "2rem",
              right: "2rem",
              padding: "0.75rem 1rem",
              background: C.primary,
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 30,
            }}
          >
            ↑ Top
          </button>
        </article>
      </main>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle {
            display: inline-flex !important;
          }

          aside {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            height: 100vh !important;
            z-index: 45 !important;
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1) !important;
          }

          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
