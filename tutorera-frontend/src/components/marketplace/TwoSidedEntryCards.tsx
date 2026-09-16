import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";

export default function TwoSidedEntryCards() {
  return (
    <section style={{ maxWidth: 1120, margin: "2.5rem auto 0", padding: "0 1.5rem" }} aria-label="Two-sided marketplace entry">
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem"
      }}>
        
        {/* For Students & Parents Card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "1.25rem",
          padding: "2rem",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#016ef8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              FOR STUDENTS & PARENTS
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "0.5rem", background: "#eef5ff", color: "#016ef8",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <BookOpen size={20} />
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#021550", margin: 0 }}>
              Looking for a Tutor?
            </h3>
          </div>
          
          <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Post your subject, grade or level, schedule, learning mode, location, ZIP code where applicable, and preferred budget. Suitable tutors can respond with offers so you can compare and choose.
          </p>
          
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              href="/post-tuition-request"
              style={{
                background: "#0329b2",
                color: "white",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.625rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 4px 12px rgba(3, 41, 178, 0.25)"
              }}
            >
              Post Tuition Requirement <ArrowRight size={15} />
            </Link>
            <Link
              href="/tutors"
              style={{
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Browse Tutors →
            </Link>
          </div>
        </div>

        {/* For Tutors Card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "1.25rem",
          padding: "2rem",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#7c1bea", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              FOR TUTORS
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "0.5rem", background: "#f3e8ff", color: "#7c1bea",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <GraduationCap size={20} />
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#021550", margin: 0 }}>
              Looking for Students?
            </h3>
          </div>
          
          <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Create your tutor profile and discover relevant online and home tuition or local tutoring opportunities matched to your subjects, availability, location, service area, curriculum, grade levels and verification status.
          </p>
          
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              href="/opportunities"
              style={{
                background: "#021550",
                color: "white",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.625rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 4px 12px rgba(2, 21, 80, 0.25)"
              }}
            >
              Find Tuition Opportunities <ArrowRight size={15} />
            </Link>
            <Link
              href="/become-a-tutor"
              style={{
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Become a Tutor →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
