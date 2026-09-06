import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BookOpen,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  ShieldCheck,
  Award,
  Video,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import TutorProfileActions from "@/components/Tutors/TutorProfileActions";
import StickyTutorProfileCTA from "@/components/Tutors/StickyTutorProfileCTA";
import AvatarImage from "@/components/Common/AvatarImage";
import TutorVideoPlayer from "@/components/Tutors/TutorVideoPlayer";
import { fetchTutor, tutorProfileHref } from "@/lib/tutor-directory";
import { SITE_URL } from "@/lib/site";
import type { Review } from "@/types/tutor";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tutorera-backend.onrender.com/api/v1";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tutor = await fetchTutor(id);
  if (!tutor) {
    return {
      title: "Tutor Profile | TUTORERA",
      robots: { index: false, follow: true },
    };
  }

  const name = tutor.user?.name || tutor.fullName || "Verified Tutor";
  const primarySubject = tutor.subjects?.[0] || "Tuition";
  const city = tutor.city || tutor.user?.city || "Pakistan";
  const modeText = tutor.teachingMode === "both" ? "Online & In-Person" : tutor.teachingMode === "online" ? "Online" : "In-Person";
  const rateText = tutor.hourlyRate ? `${tutor.currency || "PKR"} ${tutor.hourlyRate.toLocaleString()}/hr` : "Competitive rates";

  const title = `${name} - ${primarySubject} Tutor in ${city} (${modeText}) | TUTORERA`;
  const description = `${name} is an approved, verified ${primarySubject} educator serving students in ${city} and worldwide (${modeText}). Offering ${tutor.subjects?.slice(0, 3).join(", ") || primarySubject} across ${tutor.levels?.slice(0, 3).join(", ") || "standard curricula"} at ${rateText}.`;
  const canonical = tutorProfileHref(tutor);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | TUTORERA`,
      description,
      url: `${SITE_URL}${canonical}`,
      type: "profile",
      images: tutor.user?.avatar ? [{ url: tutor.user.avatar, alt: name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: tutor.user?.avatar ? [tutor.user.avatar] : undefined,
    },
  };
}

interface Slot {
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

async function extras(
  userId: string
): Promise<{ reviews: Review[]; slots: Slot[] }> {
  try {
    const [reviewsResponse, slotsResponse] = await Promise.all([
      fetch(`${API_URL}/reviews/${userId}?limit=10`, {
        next: { revalidate: 300 },
      }),
      fetch(`${API_URL}/tutors/${userId}/availability`, {
        next: { revalidate: 300 },
      }),
    ]);
    const reviews = reviewsResponse.ok ? await reviewsResponse.json() : {};
    const slots = slotsResponse.ok ? await slotsResponse.json() : {};
    return { reviews: reviews.reviews ?? [], slots: slots.slots ?? [] };
  } catch {
    return { reviews: [], slots: [] };
  }
}

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "1.5rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
} as const;

export default async function TutorProfilePage({ params }: Props) {
  const { id } = await params;
  const tutor = await fetchTutor(id);
  if (!tutor) notFound();

  const name = tutor.user?.name || tutor.fullName || "Tutor";
  const city = tutor.city || tutor.user?.city || "Pakistan";
  const avatarUrl = tutor.user?.avatar || null;
  const { reviews, slots } = await extras(tutor.user._id);

  const hasVideo = Boolean(tutor.videoIntro);
  const isHomeTutor =
    tutor.teachingMode === "in-person" || tutor.teachingMode === "both";

  const canonical = tutorProfileHref(tutor);
  const profileSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}${canonical}#webpage`,
        url: `${SITE_URL}${canonical}`,
        name: `${name} - ${tutor.subjects?.[0] || "Tuition"} Tutor`,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Tutors", item: `${SITE_URL}/tutors` },
            { "@type": "ListItem", position: 3, name, item: `${SITE_URL}${canonical}` },
          ],
        },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}${canonical}#person`,
        name,
        image: avatarUrl || undefined,
        description: tutor.bio || `${name} is a verified educator on TUTORERA.`,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressCountry: tutor.countryCode || "PK",
        },
        knowsAbout: tutor.subjects || [],
        alumniOf: tutor.education?.map((edu) => ({
          "@type": "EducationalOrganization",
          name: edu.institution,
        })),
        offers: {
          "@type": "Offer",
          price: tutor.hourlyRate || 0,
          priceCurrency: tutor.currency || "PKR",
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };

  return (
    <main
      style={{
        background: "#F5F7FF",
        minHeight: "100vh",
        color: "#021550",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      {/* Header Profile Hero */}
      <header
        style={{
          background: "linear-gradient(135deg, #021550 0%, #062b8c 100%)",
          padding: "3.5rem 1.5rem 3rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar with fallback */}
          <div style={{ position: "relative" }}>
            <AvatarImage
              src={avatarUrl}
              alt={`${name}, tutor in ${city}`}
              name={name}
              size={110}
              style={{
                border: "3.5px solid rgba(255, 255, 255, 0.95)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            />
            {tutor.isVerified && (
              <span
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: "#10b981",
                  color: "white",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #021550",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
                title="Verified Tutor"
              >
                <CheckCircle size={18} />
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: "flex",
                gap: ".75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  color: "white",
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                {name}
              </h1>

              {tutor.isVerified && (
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    color: "#86efac",
                    display: "inline-flex",
                    gap: ".35rem",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 999,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <CheckCircle size={15} /> Verified Tutor
                </span>
              )}

              {tutor.teachingMode === "online" && (
                <span
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    color: "#93c5fd",
                    display: "inline-flex",
                    gap: ".35rem",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 999,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                  }}
                >
                  🌐 Online Verified
                </span>
              )}

              {tutor.policeVerificationStatus === "approved" && (
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.25)",
                    color: "#86efac",
                    display: "inline-flex",
                    gap: ".35rem",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 999,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "1px solid rgba(16, 185, 129, 0.5)",
                  }}
                >
                  🛡️ Police Verified (Home Tuition)
                </span>
              )}

              {hasVideo && (
                <span
                  style={{
                    backgroundColor: "rgba(200, 27, 127, 0.25)",
                    color: "#f472b6",
                    display: "inline-flex",
                    gap: ".35rem",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 999,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "1px solid rgba(200, 27, 127, 0.4)",
                  }}
                >
                  <Video size={15} /> Video Intro Available
                </span>
              )}
            </div>

            <p
              style={{
                color: "#93c5fd",
                marginTop: ".5rem",
                fontSize: "1.05rem",
                fontWeight: 600,
              }}
            >
              {tutor.subjects?.join(" • ") || "Academic Tutor"}
            </p>

            <div
              style={{
                color: "#cbd5e1",
                marginTop: ".6rem",
                display: "flex",
                gap: "1.25rem",
                flexWrap: "wrap",
                fontSize: "0.9rem",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <MapPin size={16} color="#60a5fa" /> {city}
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Star size={16} color="#fbbf24" fill="#fbbf24" />{" "}
                <strong style={{ color: "white" }}>
                  {tutor.averageRating?.toFixed(1) || "New"}
                </strong>{" "}
                ({tutor.totalReviews || 0} student reviews)
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Clock size={16} color="#60a5fa" /> {tutor.experience || 0}{" "}
                years experience
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "2.5rem 1.5rem 6rem",
          display: "grid",
          gridTemplateColumns: "minmax(0,2fr) minmax(300px,1fr)",
          gap: "2rem",
        }}
        className="profile-grid"
      >
        {/* Left Column Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* ── DEMO VIDEO PLAYER (If available) ── */}
          {hasVideo && tutor.videoIntro && (
            <TutorVideoPlayer
              videoUrl={tutor.videoIntro}
              tutorName={name}
              posterUrl={avatarUrl || undefined}
            />
          )}

          {/* ── TRUST & VERIFICATION PILLARS ── */}
          <section style={card}>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#021550",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ShieldCheck size={20} color="#0329B2" />
              Verification & Marketplace Trust
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.75rem 1rem",
                  borderRadius: 10,
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <CheckCircle size={18} color="#16a34a" />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534" }}>
                    CNIC & Identity
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#15803d" }}>
                    Verified by Admin
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.75rem 1rem",
                  borderRadius: 10,
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <Award size={18} color="#2563eb" />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e40af" }}>
                    Degree & Credentials
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#1d4ed8" }}>
                    Academic Document Checked
                  </div>
                </div>
              </div>

              {hasVideo ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.75rem 1rem",
                    borderRadius: 10,
                    backgroundColor: "#fdf2f8",
                    border: "1px solid #fbcfe8",
                  }}
                >
                  <Video size={18} color="#db2777" />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9d174d" }}>
                      Demo Video
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#be185d" }}>
                      Screening Verified
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.75rem 1rem",
                    borderRadius: 10,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <FileCheck2 size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                      Platform Screened
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      TUTORERA Guarantee
                    </div>
                  </div>
                </div>
              )}

              {isHomeTutor && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.75rem 1rem",
                    borderRadius: 10,
                    backgroundColor: "#faf5ff",
                    border: "1px solid #e9d5ff",
                  }}
                >
                  <ShieldCheck size={18} color="#9333ea" />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b21a8" }}>
                      Home Tuition Safe
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#7e22ce" }}>
                      Background Screened
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* About section */}
          <section style={card}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#021550", marginBottom: ".8rem" }}>
              About {name}
            </h2>
            <p style={{ color: "#374151", lineHeight: 1.8, fontSize: "0.95rem", whiteSpace: "pre-line" }}>
              {tutor.bio ||
                `${name} is a verified tutor on TUTORERA specializing in ${tutor.subjects?.join(
                  ", "
                )}. Dedicated to student-centric learning, conceptual clarity, and regular assessment.`}
            </p>
          </section>

          {/* Subjects & Levels */}
          <section style={card}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#021550", marginBottom: "1rem" }}>
              Subjects & Teaching Levels
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", marginBottom: "1.25rem" }}>
              {tutor.subjects?.map((subject) => (
                <span
                  key={subject}
                  style={{
                    background: "#EEF5FF",
                    color: "#0329B2",
                    padding: ".45rem .95rem",
                    borderRadius: 999,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    border: "1px solid #dbeafe",
                  }}
                >
                  {subject}
                </span>
              ))}
            </div>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Target Grade / Levels:
              </span>
              <p style={{ color: "#1f2937", fontWeight: 500, marginTop: "0.3rem" }}>
                {tutor.levels?.join(" • ") || "All standard school & college levels."}
              </p>
            </div>
          </section>

          {/* Education */}
          {tutor.education?.length > 0 && (
            <section style={card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#021550", marginBottom: "1rem" }}>
                Academic Background & Education
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {tutor.education.map((edu) => (
                  <div
                    key={edu._id}
                    style={{
                      borderLeft: "3px solid #0329B2",
                      paddingLeft: "1rem",
                    }}
                  >
                    <strong style={{ fontSize: "1rem", color: "#021550" }}>{edu.degree}</strong>
                    <p style={{ color: "#4b5563", fontSize: "0.9rem", margin: "0.2rem 0 0" }}>
                      {edu.institution}
                      {edu.year ? ` • Class of ${edu.year}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Teaching Details */}
          <section style={card}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#021550", marginBottom: "1rem" }}>
              Teaching Details & Methodology
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: 10 }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>MODE OF TUITION</span>
                <p style={{ color: "#021550", fontWeight: 700, margin: "0.25rem 0 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <BookOpen size={17} color="#0329B2" />
                  {tutor.teachingMode === "both"
                    ? "Online & In-Person (Home)"
                    : tutor.teachingMode === "online"
                    ? "Online Tuition"
                    : "In-Person (Home) Tuition"}
                </p>
                <div style={{ marginTop: "0.5rem", fontSize: "0.76rem", fontWeight: 600 }}>
                  {tutor.teachingMode === "online" ? (
                    <span style={{ color: "#15803d", backgroundColor: "#f0fdf4", padding: "3px 8px", borderRadius: 4, border: "1px solid #bbf7d0", display: "inline-block" }}>
                      🟢 Online Only — Borderless (No Police Check Required)
                    </span>
                  ) : tutor.policeVerificationStatus === "approved" ? (
                    <span style={{ color: "#166534", backgroundColor: "#dcfce7", padding: "3px 8px", borderRadius: 4, border: "1px solid #86efac", display: "inline-block" }}>
                      🛡️ Police Verified for Home Tuition
                    </span>
                  ) : (
                    <span style={{ color: "#9a3412", backgroundColor: "#ffedd5", padding: "3px 8px", borderRadius: 4, border: "1px solid #fed7aa", display: "inline-block" }}>
                      ⚠️ Home Tuition Pending Police Verification Report
                    </span>
                  )}
                </div>
              </div>

              <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: 10 }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>EXPERIENCE</span>
                <p style={{ color: "#021550", fontWeight: 700, margin: "0.25rem 0 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Clock size={17} color="#0329B2" />
                  {tutor.experience || 0} Years Teaching
                </p>
              </div>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "1rem", lineHeight: 1.5 }}>
              * You can discuss syllabus coverage, test series frequency, and custom lesson schedules directly with the tutor or negotiate rates through our student-led marketplace.
            </p>
          </section>

          {/* Upcoming availability */}
          {slots.length > 0 && (
            <section style={card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#021550", marginBottom: "1rem" }}>
                Upcoming Availability
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: ".6rem" }}>
                {slots.slice(0, 8).map((slot) => (
                  <div
                    key={`${slot.date}-${slot.startTime}`}
                    style={{
                      padding: "0.6rem 0.85rem",
                      backgroundColor: "#f8fafc",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.85rem",
                      color: "#334155",
                    }}
                  >
                    <strong>{slot.dayName}</strong>
                    <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      {slot.startTime} – {slot.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Student Reviews */}
          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#021550", margin: 0 }}>
                Student Reviews ({tutor.totalReviews || 0})
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 700, color: "#021550" }}>
                <Star size={18} color="#fbbf24" fill="#fbbf24" />
                <span>{tutor.averageRating?.toFixed(1) || "5.0"} / 5.0</span>
              </div>
            </div>

            {reviews.length ? (
              reviews.map((review) => (
                <article
                  key={review._id}
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    padding: "1.1rem 0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#021550", fontSize: "0.95rem" }}>
                      {review.student?.name || "Verified Student"}
                    </strong>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          color={i < review.rating ? "#fbbf24" : "#e2e8f0"}
                          fill={i < review.rating ? "#fbbf24" : "#e2e8f0"}
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ color: "#4b5563", lineHeight: 1.6, marginTop: ".4rem", fontSize: "0.9rem" }}>
                    {review.comment}
                  </p>
                </article>
              ))
            ) : (
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                No completed session reviews yet. Book the first session with {name}!
              </p>
            )}
          </section>
        </div>

        {/* Right Sticky Column: Actions & Booking / Marketplace Invite */}
        <aside>
          <div style={{ ...card, position: "sticky", top: 90 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
                DIRECT HOURLY RATE
              </span>
              <span
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  color: "#0329B2",
                }}
              >
                {tutor.currency || "PKR"} {tutor.hourlyRate?.toLocaleString()}
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#64748b" }}>
                  /hr
                </span>
              </span>
            </div>

            <div
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: 8,
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: "0.78rem",
                color: "#166534",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Sparkles size={14} color="#16a34a" />
              <span>
                <strong>100% Student Guarantee:</strong> First trial session refund if not satisfied.
              </span>
            </div>

            <TutorProfileActions
              profileId={tutor._id}
              tutorUserId={tutor.user._id}
              tutorName={name}
              hourlyRate={tutor.hourlyRate}
              currency={tutor.currency || "PKR"}
              subjects={tutor.subjects || []}
              teachingMode={tutor.teachingMode}
              city={city}
            />
          </div>
        </aside>
      </div>

      {/* Sticky Bottom CTA for Mobile */}
      <StickyTutorProfileCTA
        tutorId={tutor._id}
        tutorUserId={tutor.user._id}
        tutorName={name}
        hourlyRate={tutor.hourlyRate}
        currency={tutor.currency || "PKR"}
        rating={tutor.averageRating}
        teachingMode={tutor.teachingMode}
        city={city}
        subjects={tutor.subjects || []}
      />

      <style>{`
        @media(max-width:860px){
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
