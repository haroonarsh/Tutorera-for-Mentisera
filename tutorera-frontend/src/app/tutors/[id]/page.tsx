import { notFound } from "next/navigation";
import Image from "next/image";
import { BookOpen, CheckCircle, Clock, MapPin, Star } from "lucide-react";
import TutorProfileActions from "@/components/Tutors/TutorProfileActions";
import { fetchTutor } from "@/lib/tutor-directory";
import type { Review } from "@/types/tutor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";
type Props = { params: Promise<{ id: string }> };
interface Slot { date: string; dayName: string; startTime: string; endTime: string; }

async function extras(userId: string): Promise<{ reviews: Review[]; slots: Slot[] }> {
  try {
    const [reviewsResponse, slotsResponse] = await Promise.all([
      fetch(`${API_URL}/reviews/${userId}?limit=10`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/tutors/${userId}/availability`, { next: { revalidate: 300 } }),
    ]);
    const reviews = reviewsResponse.ok ? await reviewsResponse.json() : {};
    const slots = slotsResponse.ok ? await slotsResponse.json() : {};
    return { reviews: reviews.reviews ?? [], slots: slots.slots ?? [] };
  } catch { return { reviews: [], slots: [] }; }
}

const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem" } as const;

export default async function TutorProfilePage({ params }: Props) {
  const { id } = await params; const tutor = await fetchTutor(id); if (!tutor) notFound();
  const name = tutor.user?.name || tutor.fullName || "Tutor";
  const city = tutor.city || tutor.user?.city || "Pakistan";
  const { reviews, slots } = await extras(tutor.user._id);
  return <main style={{ background: "#F5F7FF", minHeight: "100vh", color: "#021550" }}>
    <header style={{ background: "#021550", padding: "3rem 1.5rem" }}><div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
      <div style={{ width: 104, height: 104, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", background: "#0329B2", color: "white", fontSize: "2.4rem", fontWeight: 800 }}>{tutor.user?.avatar ? <Image src={tutor.user.avatar} alt={`${name}, tutor in ${city}`} width={104} height={104} sizes="104px" priority style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : name.charAt(0)}</div>
      <div><div style={{ display: "flex", gap: ".6rem", alignItems: "center", flexWrap: "wrap" }}><h1 style={{ color: "white", fontSize: "2rem" }}>{name}</h1>{tutor.isVerified && <span style={{ color: "#86efac", display: "flex", gap: ".3rem", alignItems: "center" }}><CheckCircle size={17} /> Verified tutor</span>}</div>
      <p style={{ color: "#cbd5e1", marginTop: ".5rem" }}>{tutor.subjects?.join(" • ")}</p><p style={{ color: "#9ca3af", marginTop: ".45rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}><span><MapPin size={14} style={{ display: "inline" }} /> {city}</span><span><Star size={14} style={{ display: "inline" }} /> {tutor.averageRating?.toFixed(1) || "New"} ({tutor.totalReviews || 0} reviews)</span></p></div>
    </div></header>
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 5rem", display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(260px,1fr)", gap: "1.5rem" }} className="profile-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <section style={card}><h2 style={{ marginBottom: ".8rem" }}>About {name}</h2><p style={{ color: "#4b5563", lineHeight: 1.8 }}>{tutor.bio || `${name} is a verified tutor offering lessons in ${tutor.subjects?.join(", ")}.`}</p></section>
        <section style={card}><h2 style={{ marginBottom: "1rem" }}>Subjects and teaching levels</h2><div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1rem" }}>{tutor.subjects?.map((subject) => <span key={subject} style={{ background: "#EEF5FF", color: "#0329B2", padding: ".4rem .8rem", borderRadius: 999 }}>{subject}</span>)}</div><p style={{ color: "#4b5563" }}>{tutor.levels?.join(" • ") || "Contact the tutor to confirm supported levels."}</p></section>
        {tutor.education?.length > 0 && <section style={card}><h2 style={{ marginBottom: "1rem" }}>Education</h2>{tutor.education.map((education) => <div key={education._id} style={{ marginBottom: ".8rem" }}><strong>{education.degree}</strong><p style={{ color: "#6b7280" }}>{education.institution}{education.year ? ` • ${education.year}` : ""}</p></div>)}</section>}
        <section style={card}><h2 style={{ marginBottom: "1rem" }}>Teaching details</h2><p style={{ color: "#4b5563", lineHeight: 1.8 }}><BookOpen size={16} style={{ display: "inline" }} /> Mode: {tutor.teachingMode === "both" ? "Online and in-person" : tutor.teachingMode}<br /><Clock size={16} style={{ display: "inline" }} /> Experience: {tutor.experience || 0} years<br />Languages, curriculum preferences, and lesson goals can be confirmed before booking.</p></section>
        {slots.length > 0 && <section style={card}><h2 style={{ marginBottom: "1rem" }}>Upcoming availability</h2><div style={{ display: "grid", gap: ".6rem" }}>{slots.slice(0, 8).map((slot) => <p key={`${slot.date}-${slot.startTime}`} style={{ color: "#4b5563" }}>{slot.dayName}, {slot.date}: {slot.startTime}–{slot.endTime}</p>)}</div></section>}
        <section style={card}><h2 style={{ marginBottom: "1rem" }}>Student reviews</h2>{reviews.length ? reviews.map((review) => <article key={review._id} style={{ borderTop: "1px solid #e5e7eb", padding: "1rem 0" }}><strong>{review.student?.name || "Student"} • {review.rating}/5</strong><p style={{ color: "#4b5563", lineHeight: 1.7, marginTop: ".4rem" }}>{review.comment}</p></article>) : <p style={{ color: "#6b7280" }}>No completed-booking reviews yet.</p>}</section>
      </div>
      <aside><div style={{ ...card, position: "sticky", top: 90 }}><h2 style={{ marginBottom: ".5rem" }}>Book a session</h2><p style={{ color: "#6b7280", marginBottom: "1rem" }}>PKR {tutor.hourlyRate?.toLocaleString()}/hour</p><TutorProfileActions profileId={tutor._id} tutorUserId={tutor.user._id} tutorName={name} hourlyRate={tutor.hourlyRate} subjects={tutor.subjects || []} teachingMode={tutor.teachingMode} city={city} /></div></aside>
    </div><style>{`@media(max-width:760px){.profile-grid{grid-template-columns:1fr!important}}`}</style>
  </main>;
}
