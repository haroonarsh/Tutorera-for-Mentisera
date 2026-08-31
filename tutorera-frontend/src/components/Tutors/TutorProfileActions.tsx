"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import DirectBookingModal from "@/components/Dashboard/DirectBookingModal";
import { useFavourites } from "@/hooks/useFavourites";

interface Props { profileId: string; tutorUserId: string; tutorName: string; hourlyRate: number; subjects: string[]; teachingMode: "online" | "in-person" | "both"; city: string; }

export default function TutorProfileActions(props: Props) {
  const [booking, setBooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isFavourited, toggleFavourite, isStudent, loaded } = useFavourites();
  const saved = isFavourited(props.profileId);
  return <>
    {loaded && isStudent && <button disabled={saving} onClick={async () => { setSaving(true); await toggleFavourite(props.profileId); setSaving(false); }} style={{ width: "100%", display: "flex", justifyContent: "center", gap: ".5rem", padding: ".75rem", marginBottom: ".75rem", borderRadius: 8, border: "1px solid #fecdd3", background: saved ? "#fff1f2" : "white", color: "#e94560", fontWeight: 700 }}><Heart size={17} fill={saved ? "currentColor" : "none"} />{saved ? "Saved to Favourites" : "Save to Favourites"}</button>}
    <button onClick={() => setBooking(true)} style={{ width: "100%", padding: ".9rem", border: 0, borderRadius: 8, background: "#2563eb", color: "white", fontWeight: 800, cursor: "pointer" }}>Book Now</button>
    {booking && <DirectBookingModal tutorId={props.tutorUserId} tutorUserId={props.tutorUserId} tutorName={props.tutorName} hourlyRate={props.hourlyRate} tutorSubjects={props.subjects} tutorTeachingMode={props.teachingMode} tutorCity={props.city} onClose={() => setBooking(false)} onSuccess={() => setBooking(false)} />}
  </>;
}
