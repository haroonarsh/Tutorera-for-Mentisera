import Link from "next/link";
import { fetchTutors, tutorProfileHref } from "@/lib/tutor-directory";
import type { TutorSearchFilters } from "@/lib/tutor-directory";
import type { TutorProfile } from "@/types/tutor";

type Match = { subject?: string; level?: string; city?: string; countryCode?: string; curriculum?: string };
const country = (slug: string) => /dubai|abu-dhabi|\buae\b/.test(slug) ? "AE" : /riyadh|jeddah|saudi-arabia/.test(slug) ? "SA" : /\buk\b/.test(slug) ? "GB" : /\busa\b|ap-calculus/.test(slug) ? "US" : /lahore|karachi|islamabad|pakistan/.test(slug) ? "PK" : undefined;
export function blogTutorMatch(slug: string, title: string): Match {
  const text = (slug + " " + title).toLowerCase();
  const subject = /math|algebra|calculus/.test(text) ? "Mathematics" : /chemistry/.test(text) ? "Chemistry" : /physics/.test(text) ? "Physics" : /biology/.test(text) ? "Biology" : undefined;
  const level = /a-level/.test(slug) ? "A-Level (Cambridge / Edexcel)" : /o-level/.test(slug) ? "O-Level (Cambridge / Edexcel)" : undefined;
  const city = ["Dubai", "Abu Dhabi", "Riyadh", "Jeddah", "Lahore", "Karachi", "Islamabad"].find(c => text.includes(c.toLowerCase().replaceAll(" ", "-")) || text.includes(c.toLowerCase()));
  return { subject, level, city, countryCode: country(slug), curriculum: /igcse|o.level|a.level|gcse/.test(text) ? "Cambridge" : undefined };
}
function matches(tutor: TutorProfile, match: Match): boolean {
  if (match.subject && !tutor.subjects?.some(s => s.toLowerCase().includes(match.subject!.toLowerCase()))) return false;
  if (match.level && !tutor.levels?.some(l => l.toLowerCase() === match.level!.toLowerCase())) return false;
  if (match.countryCode && (tutor.countryCode || tutor.user?.countryCode) !== match.countryCode && tutor.teachingMode === "in-person") return false;
  if (match.city && (tutor.city || tutor.user?.city || "").toLowerCase() !== match.city.toLowerCase() && tutor.teachingMode === "in-person") return false;
  return true;
}
export default async function BlogRelevantTutors({ slug, title }: { slug: string; title: string }) {
  const match = blogTutorMatch(slug, title);
  const filters: TutorSearchFilters = {};
  if (match.subject) filters.subject = match.subject;
  if (match.level) filters.level = match.level;
  if (match.countryCode) filters.countryCode = match.countryCode;
  if (match.city) filters.city = match.city;
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  const browseHref = `/tutors${params.size ? "?" + params.toString() : ""}`;
  const hasSpecificMatch = Boolean(match.subject || match.level || match.city || match.countryCode);
  const result = hasSpecificMatch ? await fetchTutors(filters, 24) : { tutors: [], total: 0, error: false };
  const tutors = result.tutors.filter(t => t._id && matches(t, match)).slice(0, 3);
  return <section aria-labelledby="blog-relevant-tutors" style={{ marginTop: 28, background: "white", border: "1px solid #dbe3ef", borderRadius: 16, padding: "1.5rem" }}>
    <h2 id="blog-relevant-tutors" style={{ color: "#021550", fontSize: "1.5rem", marginBottom: 8 }}>Find a tutor for this topic</h2>
    <p style={{ color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>Compare tutor profiles, check their subjects and teaching options, then use the booking or request action on the tutor profile. Availability and final fees must be confirmed before booking.</p>
    {tutors.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
      {tutors.map(t => <div key={t._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: "1.05rem", color: "#021550", marginBottom: 6 }}>{t.user?.name || t.fullName || "Tutor"}</h3>
        <p style={{ fontSize: 14, color: "#475569" }}>{t.subjects?.slice(0, 2).join(", ") || "Subjects on profile"}</p>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 5 }}>{t.city || t.user?.city || "Location on profile"} · {t.teachingMode === "both" ? "Online & in-person" : t.teachingMode === "online" ? "Online" : "In-person"}</p>
        {t.hourlyRate > 0 && t.currency ? <p style={{ fontSize: 14, marginTop: 8 }}>{t.currency} {t.hourlyRate.toLocaleString("en-US")}/hour</p> : null}
        <Link href={tutorProfileHref(t)} style={{ display: "inline-block", marginTop: 12, color: "#0329B2", fontWeight: 700 }}>View profile and booking options</Link>
      </div>)}
    </div> : <p style={{ color: "#475569", marginBottom: 14 }}>{result.error ? "Tutor listings are temporarily unavailable." : hasSpecificMatch ? "No matching tutor profiles are currently shown for these filters." : "Explore tutor profiles and choose filters that match your learning goals."} You can explore the directory and adjust your search.</p>}
    <p style={{ marginTop: 18 }}><Link href={browseHref} style={{ color: "#0329B2", fontWeight: 700 }}>Browse matching tutors and request a lesson</Link></p>
    <p style={{ color: "#64748b", fontSize: 12, marginTop: 10 }}>Profiles are shown from live directory data; inclusion is not an endorsement or a guarantee of availability.</p>
  </section>;
}
