"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { UI_COLORS } from "@/lib/brand";

const C = UI_COLORS;

const guidebookSections = [
  { id: "intro", title: "Introduction", anchor: "introduction" },
  { id: "getting-started", title: "1. Getting Started", anchor: "getting-started" },
  { id: "dashboard", title: "2. Your Tutor Dashboard", anchor: "dashboard" },
  { id: "how-it-works", title: "3. How TUTORERA Works for Tutors", anchor: "how-it-works" },
  { id: "verification", title: "4. Getting Verified", anchor: "verification" },
  { id: "documents", title: "5. Verification Documents", anchor: "documents" },
  { id: "resubmission", title: "6. Fixing a Rejected Document", anchor: "resubmission" },
  { id: "browse-requests", title: "7. Browsing Tuition Requests", anchor: "browse-requests" },
  { id: "making-offers", title: "8. Making Offers & Bids", anchor: "making-offers" },
  { id: "negotiation", title: "9. Negotiation & Counter-Offers", anchor: "negotiation" },
  { id: "profile", title: "10. Building a Strong Profile", anchor: "profile" },
  { id: "communication", title: "11. Communicating With Students", anchor: "communication" },
  { id: "online-teaching", title: "12. Teaching Online", anchor: "online-teaching" },
  { id: "home-tuition", title: "13. Home / In-Person Tuition", anchor: "home-tuition" },
  { id: "bookings", title: "14. Managing Bookings", anchor: "bookings" },
  { id: "earnings", title: "15. Earnings & Commission", anchor: "earnings" },
  { id: "payouts", title: "16. Payments & Payouts", anchor: "payouts" },
  { id: "cancellations", title: "17. Cancellations & No-Shows", anchor: "cancellations" },
  { id: "ratings", title: "18. Ratings & Reviews", anchor: "ratings" },
  { id: "quality", title: "19. Quality Standards", anchor: "quality" },
  { id: "safety", title: "20. Safety & Conduct", anchor: "safety" },
  { id: "account-protection", title: "21. Protecting Your Account", anchor: "account-protection" },
  { id: "notifications", title: "22. Notifications", anchor: "notifications" },
  { id: "common-problems", title: "23. Common Problems", anchor: "common-problems" },
  { id: "contact-support", title: "24. Contacting TUTORERA", anchor: "contact-support" },
  { id: "checklist", title: "25. Recommended Tutor Checklist", anchor: "checklist" },
  { id: "remember", title: "26. Remember", anchor: "remember" },
];

type BoxVariant = "success" | "warning" | "danger" | "info";

const BOX_STYLES: Record<BoxVariant, { bg: string; border: string; title: string; text: string }> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", title: "#15803d", text: "#166534" },
  warning: { bg: "#fef3c7", border: "#fcd34d", title: "#92400e", text: "#854d0e" },
  danger: { bg: "#fee2e2", border: "#fecaca", title: "#991b1b", text: "#b91c1c" },
  info: { bg: "#eff6ff", border: "#bfdbfe", title: "#0c4a6e", text: "#164e63" },
};

function Box({ variant, title, children }: { variant: BoxVariant; title?: string; children: React.ReactNode }) {
  const s = BOX_STYLES[variant];
  return (
    <div style={{ background: s.bg, padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${s.border}`, marginBottom: "1rem" }}>
      {title && <strong style={{ color: s.title, display: "block", marginBottom: "0.5rem" }}>{title}</strong>}
      <div style={{ color: s.text, fontSize: "0.9rem", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: "0.25rem" }}>{it}</li>
      ))}
    </ul>
  );
}

function Ol({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ margin: 0, paddingLeft: "1.5rem" }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: "0.4rem" }}>{it}</li>
      ))}
    </ol>
  );
}

function H2({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: C.primary, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
      {num}. {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ color: C.primary, fontSize: "1rem", fontWeight: 700, marginTop: "1.25rem", marginBottom: "0.5rem" }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "#6b7280", lineHeight: 1.6, marginBottom: "1rem" }}>{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "white", padding: "1rem", borderRadius: "0.375rem", fontFamily: "monospace", fontSize: "0.9rem", color: C.primary, overflowX: "auto", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
      {children}
    </div>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} style={{ marginBottom: "2.5rem" }}>{children}</section>;
}

export default function TutorGuidebookPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("introduction");

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
          flexShrink: 0,
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
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        <article style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
          {/* Header / Introduction */}
          <Section id="introduction">
            <div style={{ background: "white", padding: "2rem", borderRadius: "0.75rem", border: "1px solid #e5e7eb" }}>
              <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: C.primary, marginBottom: "1rem" }}>
                🎓 TUTORERA Tutor Guidebook
              </h1>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: "1.6", marginBottom: "1rem" }}>
                Your complete guide to getting verified, winning students and getting paid on TUTORERA.
              </p>
              <p style={{ fontSize: "0.95rem", color: "#9ca3af", lineHeight: "1.6" }}>
                TUTORERA is a marketplace operated by MENTISERA that connects tutors with students and parents. Students post what they need, you submit an offer, and the student compares tutors and chooses. This guide walks through onboarding, verification, bidding, teaching and getting paid.
              </p>
              <Box variant="success" title="✓ On TUTORERA you can:">
                <Ul
                  items={[
                    "Build a public tutor profile and get verified",
                    "Browse and bid on live tuition requests",
                    "Negotiate rates directly with students",
                    "Teach online or in-person (Home Tuition)",
                    "Track bookings, earnings and payouts",
                    "Build your reputation through ratings and reviews",
                  ]}
                />
              </Box>
            </div>
          </Section>

          {/* 1. Getting Started */}
          <Section id="getting-started">
            <H2 num={1}>Getting Started</H2>
            <P>Register as a tutor and complete your application before you can appear in the marketplace.</P>
            <Box variant="info" title="You will be asked for:">
              <Ul items={["Full name, email and mobile number", "Country, state/province and city", "Subjects and levels you can teach", "Academic qualifications", "Teaching experience", "Preferred tuition mode (Online, Home Tuition, or both)"]} />
            </Box>
            <P>After you submit your application it moves into review. You can track its status at any time from <strong>Application Status</strong> in your dashboard.</P>
          </Section>

          {/* 2. Dashboard */}
          <Section id="dashboard">
            <H2 num={2}>Your Tutor Dashboard</H2>
            <P>Your dashboard is your teaching control centre. You will typically see:</P>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                { icon: "📊", title: "Dashboard", desc: "Overview of your activity and pipeline" },
                { icon: "🔍", title: "Browse Requests", desc: "Live tuition requests you can bid on" },
                { icon: "💼", title: "Teaching Opportunities", desc: "Requests matched to your subjects and levels" },
                { icon: "✉️", title: "Offers", desc: "Offers you've sent and their status" },
                { icon: "💬", title: "Messages", desc: "Communicate with students and parents" },
                { icon: "📅", title: "Bookings", desc: "Upcoming, active, completed or cancelled sessions" },
                { icon: "💰", title: "Earnings & Progress", desc: "Commission calculator, earnings and payout history" },
                { icon: "⭐", title: "Ratings", desc: "Reviews left by your students" },
                { icon: "👤", title: "My Profile", desc: "Public profile, qualifications and demo material" },
                { icon: "📄", title: "Application Status", desc: "Track your onboarding and verification progress" },
                { icon: "🔔", title: "Notifications", desc: "New requests, offers, messages and payment alerts" },
                { icon: "🆘", title: "Help & Support", desc: "Contact TUTORERA support" },
              ].map((item) => (
                <div key={item.title} style={{ background: "#f9fafb", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{item.icon}</div>
                  <strong style={{ color: C.primary, display: "block", marginBottom: "0.25rem" }}>{item.title}</strong>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 3. How it works */}
          <Section id="how-it-works">
            <H2 num={3}>How TUTORERA Works for Tutors</H2>
            <div style={{ background: `${C.primary}10`, padding: "1.5rem", borderRadius: "0.5rem", border: `1px solid ${C.primary}30` }}>
              <p style={{ color: "#1f2937", fontSize: "1.05rem", fontWeight: "600", margin: "0 0 1rem 0" }}>The normal tutor journey is:</p>
              <Mono>Apply → Submit Documents → Get Verified → Browse Requests → Send Offer → Negotiate → Get Selected → Booking Created → Teach → Get Paid → Collect Reviews</Mono>
              <p style={{ color: "#6b7280", fontSize: "0.95rem", margin: 0 }}>✓ Verification is required before your offers become visible to students.</p>
            </div>
          </Section>

          {/* 4. Getting Verified */}
          <Section id="verification">
            <H2 num={4}>Getting Verified</H2>
            <P>Verification tells students that TUTORERA reviewed the information and documents you provided. Verification is reviewed per document/component, not as a single bulk approval — each item can be approved or sent back for correction independently.</P>
            <Box variant="info" title="Verification typically covers:">
              <Ul items={["Identity document (CNIC/passport)", "Academic degree / certificate", "Demo teaching video", "Police / background check for applicable Home Tuition arrangements"]} />
            </Box>
            <P>You can track the live status of every component from <strong>Application Status</strong> in your dashboard — each one shows as Under Review, Approved, or Action Required.</P>
          </Section>

          {/* 5. Verification Documents */}
          <Section id="documents">
            <H2 num={5}>Verification Documents</H2>
            <P>Upload clear, unedited, valid documents. Blurry, cropped, expired or mismatched documents are the most common cause of delay.</P>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              {[
                { title: "CNIC / Passport", desc: "Government-issued photo ID matching your registered name." },
                { title: "Academic Degree", desc: "Highest relevant qualification certificate or transcript." },
                { title: "Demo Video", desc: "A short recording of you teaching or explaining a concept clearly." },
                { title: "Police Certificate", desc: "Required for Home Tuition in applicable regions, for student safety." },
              ].map((it) => (
                <div key={it.title} style={{ marginBottom: "0.9rem" }}>
                  <strong style={{ color: C.primary, display: "block", marginBottom: "0.2rem" }}>{it.title}</strong>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{it.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 6. Resubmission */}
          <Section id="resubmission">
            <H2 num={6}>Fixing a Rejected Document</H2>
            <P>If a component is marked <strong>Action Required</strong>, the admin review left a specific reason — read it carefully before re-uploading.</P>
            <Ol items={["Open Application Status and find the flagged component.", "Read the rejection reason shown against that document.", "Go to Resubmit Documents and upload a corrected file for that item only.", "Other already-approved components are not affected and do not need to be resubmitted.", "The component returns to Under Review and you'll be notified once it's re-checked."]} />
            <Box variant="warning" title="⚠️ Tip">
              You only need to fix the specific component that was rejected — you do not need to resubmit your entire application.
            </Box>
          </Section>

          {/* 7. Browsing Requests */}
          <Section id="browse-requests">
            <H2 num={7}>Browsing Tuition Requests</H2>
            <P>Once verified, use <strong>Browse Requests</strong> to see live tuition requests matching your subjects, levels and location.</P>
            <Box variant="info" title="Each request shows:">
              <Ul items={["Subject, level and curriculum", "Learning goal", "Tuition mode (Online or Home Tuition)", "Preferred schedule", "Student's proposed budget", "City/area for Home Tuition"]} />
            </Box>
            <P>Also check <strong>Teaching Opportunities</strong> — requests TUTORERA has matched specifically to your profile.</P>
          </Section>

          {/* 8. Making Offers */}
          <Section id="making-offers">
            <H2 num={8}>Making Offers & Bids</H2>
            <P>Submit an offer with your proposed rate and a short message explaining your approach and relevant experience.</P>
            <Box variant="warning" title="⚠️ Offers that win are rarely just the cheapest. Strengthen yours with:">
              <Ul items={["A clear, specific message (not generic copy-paste)", "Relevant experience with the exact level/curriculum", "A realistic, competitive rate", "Fast response time", "A complete, verified profile"]} />
            </Box>
          </Section>

          {/* 9. Negotiation */}
          <Section id="negotiation">
            <H2 num={9}>Negotiation & Counter-Offers</H2>
            <P>Students may counter your offer or compare it against other tutors. Example:</P>
            <Mono>
              Student posts: Mathematics Home Tutor — PKR 18,000/month<br />
              You offer: PKR 20,000<br />
              Student counters: PKR 17,000<br />
              You accept, counter again, or hold your rate
            </Mono>
            <P>Once a final rate is accepted by both sides, it becomes part of the booking record. Always confirm the pricing unit (per session vs. per month) and number of sessions before accepting.</P>
          </Section>

          {/* 10. Profile */}
          <Section id="profile">
            <H2 num={10}>Building a Strong Profile</H2>
            <P>Your profile is what students compare you against. Keep it complete and accurate:</P>
            <Ul items={["Clear profile photo", "Accurate subjects, levels and curricula", "Up-to-date qualifications and experience", "A well-recorded demo video", "Honest availability", "A concise bio that explains your teaching style"]} />
          </Section>

          {/* 11. Communication */}
          <Section id="communication">
            <H2 num={11}>Communicating With Students</H2>
            <P>Use TUTORERA messaging for all pre-booking communication.</P>
            <Box variant="danger" title="⛔ Do not request or share:">
              <Ul items={["Personal bank details before a booking is confirmed", "Requests to pay you directly outside the platform", "Your home address or other sensitive personal information"]} />
            </Box>
            <P>Respond promptly — response time and professionalism directly affect whether students choose you.</P>
          </Section>

          {/* 12. Online Teaching */}
          <Section id="online-teaching">
            <H2 num={12}>Teaching Online</H2>
            <P>Before every online session:</P>
            <Ul items={["Confirm the student's timezone against yours", "Confirm date and time in your dashboard", "Test your internet, microphone and camera", "Prepare your teaching material in advance", "Confirm the agreed video platform with the student"]} />
          </Section>

          {/* 13. Home Tuition */}
          <Section id="home-tuition">
            <H2 num={13}>Home / In-Person Tuition</H2>
            <P>Home Tuition requires additional verification (including a police/background check where applicable) because it involves visiting a student's home.</P>
            <Box variant="danger" title="⛔ Respect student privacy:">
              <Ul items={["Do not request the exact address before a booking is confirmed", "Do not share the family's location or details with anyone else", "Do not visit outside agreed times without prior confirmation"]} />
            </Box>
            <P>For students under 18, a responsible adult must be present during the session — do not proceed if no guardian is present.</P>
          </Section>

          {/* 14. Bookings */}
          <Section id="bookings">
            <H2 num={14}>Managing Bookings</H2>
            <P>Once a student accepts your offer:</P>
            <Ol items={["The final rate and sessions are confirmed.", "A booking record is created.", "Review the dates, subject, rate and mode carefully.", "Where checkout applies, the booking becomes confirmed once payment is verified.", "You are notified and the session is added to your schedule."]} />
            <Box variant="warning" title="⚠️ Important">
              The booking status shown in your TUTORERA dashboard is the authoritative record — do not rely on messages alone to confirm a booking.
            </Box>
          </Section>

          {/* 15. Earnings */}
          <Section id="earnings">
            <H2 num={15}>Earnings & Commission</H2>
            <P>TUTORERA charges a platform commission on completed, paid bookings. Use the <strong>Commission Calculator</strong> in Earnings & Progress to estimate your take-home for any given rate before you set your offer.</P>
            <Ul items={["Your quoted rate is what the student sees and agrees to", "Commission is deducted according to the current fee structure", "Your Earnings & Progress page shows a running total and history"]} />
          </Section>

          {/* 16. Payouts */}
          <Section id="payouts">
            <H2 num={16}>Payments & Payouts</H2>
            <P>Payments from students are processed through TUTORERA's checkout, then paid out to you according to the platform's payout schedule.</P>
            <Box variant="danger" title="⛔ Never accept:">
              <Ul items={["Requests to be paid directly outside the platform for a marketplace booking", "Advance payments negotiated privately in chat"]} />
            </Box>
            <P>For payout issues, contact support with your booking ID, expected amount, and date.</P>
          </Section>

          {/* 17. Cancellations */}
          <Section id="cancellations">
            <H2 num={17}>Cancellations & No-Shows</H2>
            <P>If you need to cancel a confirmed booking, do it as early as possible from <strong>Bookings → Booking Details</strong> and notify the student directly.</P>
            <Box variant="warning" title="⚠️ Repeated late cancellations or no-shows affect your:">
              <Ul items={["Ranking in student search results", "Eligibility for Teaching Opportunities", "Overall quality standing on the platform"]} />
            </Box>
          </Section>

          {/* 18. Ratings */}
          <Section id="ratings">
            <H2 num={18}>Ratings & Reviews</H2>
            <P>Students rate you after eligible sessions. Reviews are a major factor in whether new students choose your offers.</P>
            <Ul items={["Be punctual and well-prepared for every session", "Communicate clearly and professionally", "Follow through on the learning plan you proposed"]} />
            <P>If you believe a review is false or abusive, report it to support with context — do not retaliate publicly.</P>
          </Section>

          {/* 19. Quality Standards */}
          <Section id="quality">
            <H2 num={19}>Quality Standards</H2>
            <P>TUTORERA monitors tutor quality using signals such as response time, acceptance rate, ratings, cancellations and complaint history.</P>
            <Box variant="info" title="ℹ️ Consistently low quality signals may lead to:">
              <Ul items={["Reduced visibility in the marketplace", "Temporary suspension pending review", "Account review or removal in serious cases"]} />
            </Box>
          </Section>

          {/* 20. Safety */}
          <Section id="safety">
            <H2 num={20}>Safety & Conduct</H2>
            <Box variant="danger" title="⛔ Immediately report:">
              <Ul items={["Harassment, threats, or inappropriate requests from a student or parent", "Fraud or suspicious off-platform payment requests", "Any situation that puts your personal safety at risk"]} />
            </Box>
            <P>If there is immediate physical danger, contact local emergency services first, then notify TUTORERA Safety & Support at <strong>hello@mentisera.pk</strong>.</P>
          </Section>

          {/* 21. Account Protection */}
          <Section id="account-protection">
            <H2 num={21}>Protecting Your Account</H2>
            <P>Use a strong, unique password and never share your login credentials, OTPs or payout account details with anyone.</P>
            <P>If you suspect unauthorized access, change your password immediately, review your recent activity, and contact support.</P>
          </Section>

          {/* 22. Notifications */}
          <Section id="notifications">
            <H2 num={22}>Notifications</H2>
            <P>Keep notifications enabled for:</P>
            <Ul items={["New matching requests", "Offer responses and counter-offers", "Messages", "Booking confirmations and cancellations", "Payout status", "Verification updates", "Security activity"]} />
          </Section>

          {/* 23. Common Problems */}
          <Section id="common-problems">
            <H2 num={23}>Common Problems</H2>
            {[
              { q: "My application has been under review for a long time", a: "Check Application Status for any component marked Action Required — it may be waiting on a corrected document from you." },
              { q: "A document I resubmitted is still pending", a: "Resubmitted documents return to Under Review and are re-checked in order — this is normal and does not require re-uploading again." },
              { q: "I'm not seeing many matching requests", a: "Review your listed subjects, levels, city and availability — an overly narrow profile reduces how many requests match you." },
              { q: "A student wants to pay me directly", a: "Decline and direct them to the platform checkout — direct payment is not covered by TUTORERA support or dispute resolution." },
              { q: "I haven't received a payout", a: "Contact support with your booking ID, amount and date so it can be traced." },
            ].map((item) => (
              <div key={item.q} style={{ background: "white", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", marginBottom: "0.75rem" }}>
                <strong style={{ color: C.primary, display: "block", marginBottom: "0.25rem" }}>{item.q}</strong>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </Section>

          {/* 24. Contact Support */}
          <Section id="contact-support">
            <H2 num={24}>Contacting TUTORERA</H2>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", border: "2px solid #3b82f6", marginBottom: "1rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: "600", margin: 0 }}>📧 Email Support</p>
                <p style={{ fontSize: "1.3rem", color: C.primary, fontWeight: "700", margin: "0.5rem 0 0 0" }}>
                  <a href="mailto:hello@mentisera.pk" style={{ color: C.primary, textDecoration: "none" }}>hello@mentisera.pk</a>
                </p>
              </div>
              <p style={{ color: "#6b7280", fontSize: "0.95rem", textAlign: "center", margin: 0 }}>
                Use support for verification issues, booking problems, payout concerns, disputes, or safety reports.
              </p>
            </div>
            <Box variant="warning">Never send passwords, OTPs or complete bank/card details via email or chat.</Box>
          </Section>

          {/* 25. Checklist */}
          <Section id="checklist">
            <H2 num={25}>Recommended Tutor Checklist</H2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }} className="checklist-grid">
              <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#15803d", display: "block", marginBottom: "0.75rem" }}>✓ Before Bidding:</strong>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#166534", fontSize: "0.875rem" }}>
                  <li>Profile complete and verified</li>
                  <li>Demo video uploaded</li>
                  <li>Subjects/levels accurate</li>
                  <li>Rate researched and realistic</li>
                </ul>
              </div>
              <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe" }}>
                <strong style={{ color: "#0c4a6e", display: "block", marginBottom: "0.75rem" }}>✓ Before Each Session:</strong>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#164e63", fontSize: "0.875rem" }}>
                  <li>Booking confirmed in dashboard</li>
                  <li>Materials prepared</li>
                  <li>Tech tested (online)</li>
                  <li>Guardian confirmed present (minors, in-person)</li>
                </ul>
              </div>
              <div style={{ background: "#fef3c7", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fcd34d" }}>
                <strong style={{ color: "#92400e", display: "block", marginBottom: "0.75rem" }}>✓ After Session:</strong>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#854d0e", fontSize: "0.875rem" }}>
                  <li>Mark session status accurately</li>
                  <li>Follow up with next steps</li>
                  <li>Keep payment records</li>
                  <li>Report any issues promptly</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* 26. Remember */}
          <Section id="remember">
            <div style={{ marginTop: "1rem", paddingTop: "2rem", borderTop: "2px solid #e5e7eb" }}>
              <div style={{ background: `${C.primary}15`, padding: "2rem", borderRadius: "0.75rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: C.primary, marginBottom: "1rem" }}>26. Remember</h2>
                <p style={{ fontSize: "1.05rem", color: "#374151", lineHeight: "1.8", maxWidth: "700px", margin: "0 auto" }}>
                  Your profile, your responsiveness and your track record are what win you students on TUTORERA. <strong>Stay verified, stay responsive, and teach well</strong> — the marketplace rewards consistency.
                </p>
              </div>
            </div>
          </Section>

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

          .checklist-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
