import { FileEdit, HandCoins, SlidersHorizontal, UserCheck, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: FileEdit,
    number: "01",
    title: "Student Posts Requirement",
    desc: "Specify subject, curriculum, schedule, location, and proposed budget in your local currency."
  },
  {
    icon: HandCoins,
    number: "02",
    title: "Tutors Find Opportunities",
    desc: "Verified tutors discover open tuition requests matching their subject expertise, service area, and rate."
  },
  {
    icon: SlidersHorizontal,
    number: "03",
    title: "Offers & Negotiation",
    desc: "Tutors accept the proposed rate or submit a counter-offer. Students compare profiles and rates."
  },
  {
    icon: UserCheck,
    number: "04",
    title: "Choose the Best Match",
    desc: "Students select their preferred tutor based on ratings, qualifications, and budget."
  },
  {
    icon: GraduationCap,
    number: "05",
    title: "Book & Learn",
    desc: "Start lessons securely, backed by TUTORERA's quality checks and First-Session Guarantee."
  }
];

export default function MarketplaceFlow() {
  return (
    <section style={{ padding: "4rem 1.5rem", background: "white" }} aria-labelledby="marketplace-flow-title">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 3rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#016ef8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            The Global Connection Marketplace
          </span>
          <h2 id="marketplace-flow-title" style={{ fontSize: "2rem", fontWeight: 800, color: "#021550", margin: "0.5rem 0 0.75rem" }}>
            How TUTORERA Connects You
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Whether you need a tutor or want to teach, our transparent matching engine connects student demand with verified tutor expertise globally and locally.
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
