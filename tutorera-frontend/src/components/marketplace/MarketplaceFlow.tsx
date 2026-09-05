import { FileEdit, HandCoins, SlidersHorizontal, UserCheck, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: FileEdit,
    number: "01",
    title: "Post Your Requirement",
    desc: "Specify subject, class level, learning mode (home or online), city, schedule and your proposed PKR budget."
  },
  {
    icon: HandCoins,
    number: "02",
    title: "Receive Tutor Offers",
    desc: "Matched verified tutors review your request and either accept your proposed rate or submit a counter-offer."
  },
  {
    icon: SlidersHorizontal,
    number: "03",
    title: "Compare & Negotiate",
    desc: "Compare ratings, qualifications, experience, match score, and rates. Negotiate transparently if needed."
  },
  {
    icon: UserCheck,
    number: "04",
    title: "Choose Your Tutor",
    desc: "Accept the tutor offer that best fits your goals. The agreed rate is securely locked for the booking."
  },
  {
    icon: GraduationCap,
    number: "05",
    title: "Book & Learn",
    desc: "Start your lessons with peace of mind backed by TUTORERA's verified review and First-Session Guarantee."
  }
];

export default function MarketplaceFlow() {
  return (
    <section style={{ padding: "4rem 1.5rem", background: "white" }} aria-labelledby="marketplace-flow-title">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 3rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#016ef8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            The Student-Led Reverse Marketplace
          </span>
          <h2 id="marketplace-flow-title" style={{ fontSize: "2rem", fontWeight: 800, color: "#021550", margin: "0.5rem 0 0.75rem" }}>
            How TUTORERA Works
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Stop endless directory browsing and phone calls. State what you need, let qualified tutors send offers to you, and choose with total transparency.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.25rem",
          position: "relative"
        }}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                style={{
                  background: "#f8faff",
                  borderRadius: "1rem",
                  padding: "1.5rem 1.25rem",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "0.625rem",
                    background: "#eef5ff",
                    color: "#0329b2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#cbd5e1" }}>
                    {step.number}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.825rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
