"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
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

export default function GuidebookPage() {
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
                📖 TUTORERA Student & Parent Guidebook
              </h1>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: "1.6", marginBottom: "1rem" }}>
                Your complete guide to finding, comparing, hiring and learning with tutors on TUTORERA.
              </p>
              <p style={{ fontSize: "0.95rem", color: "#9ca3af", lineHeight: "1.6" }}>
                TUTORERA is a student-led tutoring marketplace operated by MENTISERA. Instead of forcing students to choose from a static tutor directory, TUTORERA allows students and parents to describe what they need, propose a budget, receive offers from suitable tutors, compare those offers, communicate through the platform and select the tutor they prefer.
              </p>
              <Box variant="success" title="✓ TUTORERA supports:">
                <Ul
                  items={[
                    "Online tutoring across supported international markets",
                    "Local Home Tuition and in-person tutoring where available",
                    "Tutor discovery, requests, offers and counter-offers",
                    "Secure platform communication and verified tutors",
                    "Bookings, payment records where checkout is enabled",
                    "Reviews, complaints and dispute support",
                  ]}
                />
              </Box>
            </div>
          </Section>

          {/* 1. Getting Started */}
          <Section id="getting-started">
            <H2 num={1}>Getting Started</H2>
            <P>After creating your TUTORERA account, complete your basic profile before requesting tuition.</P>
            <Box variant="info" title="You may be asked for:">
              <Ul items={["Full name", "Email address", "Mobile number", "Country, state/province, city", "Preferred currency and timezone", "Student level and preferred subjects"]} />
            </Box>
            <P>Parents may manage tutoring arrangements for their children. Accounts for children must comply with TUTORERA's age and guardian requirements.</P>
          </Section>

          {/* 2. Dashboard */}
          <Section id="dashboard">
            <H2 num={2}>Your Student Dashboard</H2>
            <P>Your dashboard acts as your main control centre. You may see sections including:</P>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                { icon: "📊", title: "Dashboard", desc: "Overview of your activity" },
                { icon: "🔍", title: "Find Tutors", desc: "Search and compare available tutors" },
                { icon: "📝", title: "Post Request", desc: "Tell tutors what you need" },
                { icon: "📚", title: "My Requests", desc: "Track active, expired, matched and completed requests" },
                { icon: "✉️", title: "Offers", desc: "Review offers submitted by tutors" },
                { icon: "💬", title: "Messages", desc: "Communicate with tutors through TUTORERA" },
                { icon: "📅", title: "Bookings", desc: "View upcoming, active, completed or cancelled sessions" },
                { icon: "💳", title: "Payments", desc: "Checkout, payment status, receipts and transaction history" },
                { icon: "⭐", title: "Reviews", desc: "Rate tutors after eligible tutoring engagements" },
                { icon: "🔖", title: "Saved Tutors", desc: "Keep tutors you may want to consider later" },
                { icon: "🔔", title: "Notifications", desc: "Platform, booking, offer and account notifications" },
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

          {/* 3. How TUTORERA Works */}
          <Section id="how-it-works">
            <H2 num={3}>How TUTORERA Works</H2>
            <div style={{ background: `${C.primary}10`, padding: "1.5rem", borderRadius: "0.5rem", border: `1px solid ${C.primary}30` }}>
              <p style={{ color: "#1f2937", fontSize: "1.05rem", fontWeight: "600", margin: "0 0 1rem 0" }}>The normal student journey is:</p>
              <Mono>Need Tutor → Post Requirement → Set Budget → Receive Offers → Compare Tutors → Communicate → Choose Tutor → Accept Final Price → Booking Created → Payment Where Available → Learn → Review</Mono>
              <p style={{ color: "#6b7280", fontSize: "0.95rem", margin: 0 }}>✓ You do not need to pay merely to post a tuition request.</p>
            </div>
          </Section>

          {/* 4. Posting a Tuition Request */}
          <Section id="post-request">
            <H2 num={4}>Posting a Tuition Request</H2>
            <P>Select <strong>Post Tuition Request</strong> and provide accurate information so the right tutors can respond.</P>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "grid", gap: "1rem" }}>
                {[
                  { label: "Subject", examples: "Mathematics, Physics, Chemistry, Biology, English, Computer Science, Pakistan Studies, International Relations..." },
                  { label: "Student Level", examples: "Primary, Middle, Secondary, Matric, FSc, O Level, A Level, GCSE, IGCSE, IB, University, Professional exam..." },
                  { label: "Curriculum", examples: "Where relevant, specify the curriculum or examination board" },
                  { label: "Learning Goal", examples: "Concept clarification, exam preparation, homework support, complete subject tuition, spoken English, assignment guidance, entry test prep" },
                  { label: "Tuition Mode", examples: "Online Tuition or Home/In-Person Tuition" },
                  { label: "Schedule", examples: "Provide preferred days and times" },
                  { label: "Budget", examples: "Enter your preferred tutoring budget — it is a proposal. Tutors may accept it, submit another offer, or propose another rate. You remain free to choose." },
                ].map((item) => (
                  <div key={item.label}>
                    <strong style={{ color: C.primary, display: "block", marginBottom: "0.25rem" }}>{item.label}</strong>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{item.examples}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 5. Understanding Tutor Offers */}
          <Section id="understand-offers">
            <H2 num={5}>Understanding Tutor Offers</H2>
            <P>Once your requirement becomes available to eligible tutors, tutors may submit offers. An offer may include tutor name, profile, verification status, qualifications, subject expertise, experience, teaching mode, availability, proposed price, message, ratings and reviews, and response information.</P>
            <Box variant="warning" title="⚠️ Do not automatically choose the cheapest tutor. Consider:">
              <Ul items={["Subject knowledge and qualifications", "Relevant experience", "Communication", "Verification", "Reviews", "Availability", "Teaching approach", "Budget", "Location for Home Tuition"]} />
            </Box>
          </Section>

          {/* 6. Offers and Counter-Offers */}
          <Section id="offers-counter">
            <H2 num={6}>Offers and Counter-Offers</H2>
            <P>TUTORERA follows a marketplace negotiation model. Example:</P>
            <Mono>
              You post: Mathematics Home Tutor — PKR 18,000/month<br />
              Tutor A offers: PKR 18,000<br />
              Tutor B offers: PKR 20,000<br />
              Tutor C offers: PKR 16,000
            </Mono>
            <P>You decide which tutor provides the best overall value — price alone does not determine selection. Once you accept a final offer, the agreed rate becomes part of the booking record. Always review the price, pricing unit, sessions and conditions before accepting.</P>
          </Section>

          {/* 7. Communicating With Tutors */}
          <Section id="communication">
            <H2 num={7}>Communicating With Tutors</H2>
            <P>Use TUTORERA messaging whenever possible.</P>
            <Box variant="danger" title="⛔ Do not unnecessarily disclose:">
              <Ul items={["Home address", "CNIC/passport information", "Banking passwords", "Card information", "OTPs", "Personal account passwords", "Sensitive family information"]} />
            </Box>
            <P>Do not send payments merely because a tutor requests money through chat. Where TUTORERA checkout is available, use the authorized platform process. Report suspicious requests to TUTORERA.</P>
          </Section>

          {/* 8. Choosing a Tutor */}
          <Section id="choose-tutor">
            <H2 num={8}>Choosing a Tutor</H2>
            <P>Before selecting a tutor, review:</P>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              {[
                { title: "Identity / Verification", desc: "Check available verification indicators." },
                { title: "Academic Qualifications", desc: "Review education and credentials." },
                { title: "Experience", desc: "Consider whether the tutor has experience with your level or curriculum." },
                { title: "Demo/Profile Information", desc: "Where available, review the tutor's introduction or demonstration material." },
                { title: "Ratings and Reviews", desc: "Read genuine student feedback." },
                { title: "Availability", desc: "Ensure the tutor can consistently teach according to your schedule." },
                { title: "Price", desc: "Confirm the exact agreed rate and pricing unit." },
                { title: "Home Tuition Eligibility", desc: "For Home Tuition, pay attention to applicable verification and local safety requirements." },
              ].map((it) => (
                <div key={it.title} style={{ marginBottom: "0.9rem" }}>
                  <strong style={{ color: C.primary, display: "block", marginBottom: "0.2rem" }}>{it.title}</strong>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{it.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 9. Understanding Tutor Verification */}
          <Section id="verification">
            <H2 num={9}>Understanding Tutor Verification</H2>
            <P>A TUTORERA verification badge means the platform reviewed specified information supplied by the tutor according to the applicable verification process. Verification may involve:</P>
            <Ul items={["Identity documentation", "Academic credentials", "Profile review", "Demonstration material", "Additional background documentation", "Police/background documentation for applicable Home Tuition arrangements"]} />
            <Box variant="info" title="ℹ️ Important">
              Verification does not mean TUTORERA guarantees an individual's future behaviour or teaching results. Students and parents should still make their own informed decision.
            </Box>
          </Section>

          {/* 10. Online Tuition */}
          <Section id="online-tuition">
            <H2 num={10}>Online Tuition</H2>
            <P>Online tutoring allows you to work with tutors beyond your city or country where marketplace functionality is available. Before the lesson:</P>
            <Ul items={["Confirm timezone", "Confirm date and time", "Test internet", "Test microphone", "Test camera where required", "Prepare learning materials", "Confirm the agreed learning platform"]} />
            <P>Always check the time shown in your dashboard.</P>
          </Section>

          {/* 11. Home Tuition */}
          <Section id="home-tuition">
            <H2 num={11}>Home Tuition / In-Person Tuition</H2>
            <P>Home Tuition involves physical interaction and therefore has additional safety requirements. TUTORERA should initially display only an approximate student area to unmatched tutors.</P>
            <Box variant="danger" title="⛔ Do not publicly provide:">
              <Ul items={["House number", "Exact address", "Exact GPS coordinates", "Private family information"]} />
            </Box>
            <P>Your full meeting location should only be shared according to the confirmed booking process.</P>
            <H3>For students under 18</H3>
            <P>A responsible adult parent, guardian or designated adult caregiver must remain present during in-person tutoring as required by TUTORERA policy. Parents should personally evaluate the tutor before allowing recurring access to the home.</P>
          </Section>

          {/* 12. Home Tuition Distance */}
          <Section id="home-distance">
            <H2 num={12}>Home Tuition Distance</H2>
            <P>Where enabled, TUTORERA may use your approximate location to determine:</P>
            <Ul items={["Nearby tutors", "Tutor service radius", "Approximate distance", "Estimated travel distance", "Location compatibility"]} />
            <P>Exact residential coordinates should not be shown publicly.</P>
          </Section>

          {/* 13. Booking a Tutor */}
          <Section id="booking">
            <H2 num={13}>Booking a Tutor</H2>
            <P>Once you accept an eligible tutor offer:</P>
            <Ol items={["Final rate is confirmed.", "Booking details are generated.", "Review tutor, subject, rate and sessions.", "Confirm dates and tutoring mode.", "Where payment is enabled, proceed to checkout.", "Payment is verified.", "Booking becomes confirmed.", "Tutor receives notification."]} />
            <Box variant="warning" title="⚠️ Important">
              Do not consider a payment successful merely because your browser displays a success message. The booking/payment status in your TUTORERA account is the authoritative platform record.
            </Box>
          </Section>

          {/* 14. Student Fees */}
          <Section id="fees">
            <H2 num={14}>Student Fees</H2>
            <P>Creating a student account is currently free. Students can currently browse tutors, post tuition requests, receive offers, compare tutors, and communicate through the marketplace without a separate TUTORERA marketplace fee under the current pricing model.</P>
            <P>The actual tuition price is based on the rate agreed between you and the tutor. Any applicable charges must be displayed before checkout.</P>
          </Section>

          {/* 15. Payments */}
          <Section id="payments">
            <H2 num={15}>Payments</H2>
            <P>Where checkout is available:</P>
            <Mono>Accept Tutor → Confirm Final Rate → Booking Created → Review Amount → Pay → Payment Verified → Booking Confirmed</Mono>
            <Box variant="danger" title="⛔ Never share:">
              <Ul items={["Card PIN", "Banking password", "OTP", "Full card credentials through chat"]} />
            </Box>
            <P>For payment problems, provide support with: booking ID, transaction reference, date, amount, and a screenshot if available. Do not post sensitive banking data.</P>
          </Section>

          {/* 16. Failed or Pending Payments */}
          <Section id="failed-payments">
            <H2 num={16}>Failed or Pending Payments</H2>
            <Box variant="warning" title="⚠️ If money appears to have been deducted but your booking is not confirmed:">
              Do not repeatedly make payments. First check <strong>Dashboard → Payments</strong>, then contact <strong>hello@mentisera.pk</strong> with the booking and transaction reference.
            </Box>
          </Section>

          {/* 17. Cancelling a Booking */}
          <Section id="cancel-booking">
            <H2 num={17}>Cancelling a Booking</H2>
            <P>Open <strong>Dashboard → Bookings → Booking Details</strong> and use the available cancellation option.</P>
            <P>Cancellation and refund eligibility may depend on:</P>
            <Ul items={["Cancellation timing", "Tutor preparation", "Whether the lesson started", "Sessions already delivered", "Booking terms", "Applicable policy"]} />
          </Section>

          {/* 18. Refunds */}
          <Section id="refunds">
            <H2 num={18}>Refunds</H2>
            <P>Possible refund-review situations may include:</P>
            <Ul items={["Tutor cancellation", "Tutor no-show", "Duplicate payment", "Incorrect charge", "Failed transaction with debit", "Verified service failure", "Eligible partially unused package"]} />
            <P>Completed tutoring is normally not automatically refundable. For refund review provide: booking reference, transaction reference, amount, explanation, and supporting evidence.</P>
            <Box variant="info">Contact: <strong>hello@mentisera.pk</strong></Box>
          </Section>

          {/* 19. If the Tutor Does Not Arrive */}
          <Section id="tutor-no-show">
            <H2 num={19}>If the Tutor Does Not Arrive</H2>
            <H3>For Home Tuition</H3>
            <Ol items={["Check messages.", "Allow reasonable agreed arrival tolerance.", "Do not mark the session completed.", "Record relevant communication.", "Report the issue through TUTORERA support."]} />
            <H3>For Online Tuition</H3>
            <Ol items={["Check timezone.", "Check scheduled session time.", "Message the tutor through TUTORERA.", "Keep screenshots if necessary.", "Contact support if unresolved."]} />
          </Section>

          {/* 20. If You Are Not Satisfied */}
          <Section id="not-satisfied">
            <H2 num={20}>If You Are Not Satisfied</H2>
            <P>First determine whether the issue concerns:</P>
            <Ul items={["Teaching quality", "Communication", "Behaviour", "Scheduling", "Payment", "Safety", "Misrepresentation"]} />
            <P>You may:</P>
            <Ul items={["Communicate respectfully with the tutor", "Leave an appropriate review after eligible service", "Report the issue", "Request support review", "Request refund review where policy permits"]} />
          </Section>

          {/* 21. Reviews and Ratings */}
          <Section id="reviews">
            <H2 num={21}>Reviews and Ratings</H2>
            <P>Reviews should reflect genuine experiences.</P>
            <Box variant="danger" title="⛔ Do not:">
              <Ul items={["Post false reviews", "Threaten tutors with ratings", "Request compensation for changing a review", "Use discriminatory or abusive language"]} />
            </Box>
            <P>Useful reviews explain: teaching clarity, professionalism, punctuality, communication, subject competence, and overall learning experience.</P>
          </Section>

          {/* 22. Safety */}
          <Section id="safety">
            <H2 num={22}>Safety and Inappropriate Conduct</H2>
            <Box variant="danger" title="⛔ Immediately report:">
              <Ul items={["Harassment, sexual misconduct, or threats", "Fraud or violence", "Dangerous behaviour", "Attempts to obtain sensitive information", "Suspicious off-platform payment requests", "Serious identity concerns"]} />
            </Box>
            <P>If there is an immediate physical danger, contact the relevant local emergency authority first. After immediate safety has been secured, notify:</P>
            <Box variant="info">
              <strong>TUTORERA Safety & Support</strong><br />hello@mentisera.pk
            </Box>
          </Section>

          {/* 23. Protecting Your Account */}
          <Section id="account-protection">
            <H2 num={23}>Protecting Your Account</H2>
            <P>Use a strong unique password.</P>
            <Box variant="danger" title="⛔ Never share:">
              <Ul items={["Password", "OTP", "Login session", "Payment credentials"]} />
            </Box>
            <P>If you suspect unauthorized account access:</P>
            <Ol items={["Change your password.", "Log out from unknown devices where available.", "Review account activity.", "Contact support."]} />
          </Section>

          {/* 24. Notifications */}
          <Section id="notifications">
            <H2 num={24}>Notifications</H2>
            <P>Keep important notifications enabled for:</P>
            <Ul items={["Tutor offers", "Messages", "Offer acceptance", "Booking creation", "Payment status", "Session reminders", "Booking cancellation", "Support responses", "Security activity"]} />
          </Section>

          {/* 25. Request Expiry */}
          <Section id="request-expiry">
            <H2 num={25}>Request Expiry</H2>
            <P>Tuition requests should remain relevant and current. Expired or completed requests may stop appearing in the active marketplace.</P>
            <P>If you still need a tutor after expiry, create or renew the requirement where supported. Do not maintain duplicate active requests for the same requirement unless necessary.</P>
          </Section>

          {/* 26. Common Problems */}
          <Section id="common-problems">
            <H2 num={26}>Common Problems</H2>
            {[
              { q: "I am not receiving tutor offers", a: "Check subject, city, mode, budget, schedule and request description. An overly restrictive budget, schedule or location may reduce matching." },
              { q: "I cannot find my city", a: "Use the location search or contact support." },
              { q: "A tutor is asking me to pay directly", a: "Do not make an unsupported payment merely because it was requested through chat. Use the applicable TUTORERA booking/payment process." },
              { q: "My payment was deducted but booking says unpaid", a: "Contact support with the booking and transaction reference." },
              { q: "Tutor stopped responding", a: "Message through TUTORERA and consider another eligible offer if selection has not been finalized." },
              { q: "I selected the wrong tutor", a: "Contact support immediately if the booking has already been created or paid." },
              { q: "I feel unsafe", a: "End the interaction and seek immediate local assistance where necessary. Then report the matter to TUTORERA." },
            ].map((item) => (
              <div key={item.q} style={{ background: "white", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", marginBottom: "0.75rem" }}>
                <strong style={{ color: C.primary, display: "block", marginBottom: "0.25rem" }}>{item.q}</strong>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </Section>

          {/* 27. Contact Support */}
          <Section id="contact-support">
            <H2 num={27}>Contacting TUTORERA</H2>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", border: "2px solid #3b82f6", marginBottom: "1rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: "600", margin: 0 }}>📧 Email Support</p>
                <p style={{ fontSize: "1.3rem", color: C.primary, fontWeight: "700", margin: "0.5rem 0 0 0" }}>
                  <a href="mailto:hello@mentisera.pk" style={{ color: C.primary, textDecoration: "none" }}>hello@mentisera.pk</a>
                </p>
              </div>
              <p style={{ color: "#6b7280", fontSize: "0.95rem", textAlign: "center", margin: 0 }}>
                Use support for account, booking, payment issues, refund requests, complaints, or security concerns.
              </p>
            </div>
            <P>When reporting an issue, include: account email, booking/request ID, tutor name where relevant, date and time, a clear description, and screenshot/evidence where appropriate.</P>
            <Box variant="warning">Never send passwords, OTPs or complete card information.</Box>
          </Section>

          {/* 28. Checklist */}
          <Section id="checklist">
            <H2 num={28}>Recommended Student Checklist</H2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }} className="checklist-grid">
              <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#15803d", display: "block", marginBottom: "0.75rem" }}>✓ Before Hiring:</strong>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#166534", fontSize: "0.875rem" }}>
                  <li>Requirement is accurate</li>
                  <li>Tutor profile reviewed</li>
                  <li>Verification checked</li>
                  <li>Qualifications reviewed</li>
                  <li>Reviews considered</li>
                  <li>Price confirmed</li>
                  <li>Schedule confirmed</li>
                  <li>Teaching mode confirmed</li>
                  <li>Home Tuition safety considered</li>
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
              <div style={{ background: "#fef3c7", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fcd34d" }}>
                <strong style={{ color: "#92400e", display: "block", marginBottom: "0.75rem" }}>✓ After Session:</strong>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#854d0e", fontSize: "0.875rem" }}>
                  <li>Mark status accurately where required</li>
                  <li>Report problems promptly</li>
                  <li>Leave fair feedback</li>
                  <li>Keep payment and booking records</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* 29. Remember */}
          <Section id="remember">
            <div style={{ marginTop: "1rem", paddingTop: "2rem", borderTop: "2px solid #e5e7eb" }}>
              <div style={{ background: `${C.primary}15`, padding: "2rem", borderRadius: "0.75rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: C.primary, marginBottom: "1rem" }}>29. Remember</h2>
                <p style={{ fontSize: "1.05rem", color: "#374151", lineHeight: "1.8", maxWidth: "700px", margin: "0 auto" }}>
                  TUTORERA gives students and parents <strong>choice</strong>. You define your learning requirement. Tutors compete to provide suitable offers. You compare them. You choose. <strong>You remain in control</strong> of your tutoring decision.
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
