"use client";

import DirectBookingModal from "@/components/Dashboard/DirectBookingModal";
import { useFavourites } from "@/hooks/useFavourites";
import { Calendar, Heart, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { showError, showSuccess } from "@/lib/toast";

interface Props {
  profileId: string; tutorUserId: string; tutorName: string; hourlyRate: number;
  currency?: string; countryCode?: string; subjects: string[];
  teachingMode: "online" | "in-person" | "both"; city: string;
}

const activeRequirementStates = ["open", "published", "receiving_offers", "negotiating"];

export default function TutorProfileActions(props: Props) {
  const [booking, setBooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requirements, setRequirements] = useState<{ _id: string; subject: string; level: string; status: string }[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitingRequestId, setInvitingRequestId] = useState<string | null>(null);
  const { isFavourited, toggleFavourite, isStudent, loaded } = useFavourites();
  const { user } = useAuth();
  const directBookingEnabled = process.env.NEXT_PUBLIC_ENABLE_DIRECT_BOOKING !== "false";
  const saved = isFavourited(props.profileId);
  const canPostRequirement = user?.role === "student" || user?.role === "parent";

  const openInvitationPicker = async () => {
    if (!canPostRequirement) {
      window.location.assign(`/login?redirect=${encodeURIComponent(`/tutors/${props.profileId}`)}`);
      return;
    }
    try {
      const result = await api.get("/requests/my");
      setRequirements((result.data?.requests || []).filter((item: { status: string }) => activeRequirementStates.includes(item.status)));
    } catch (error) {
      showError(error, "We could not load your active requirements.");
      setRequirements([]);
    }
    setInviteOpen(true);
  };

  const inviteTutor = async (requestId: string) => {
    setInvitingRequestId(requestId);
    try {
      await api.post(`/requests/${requestId}/invitations`, { tutorId: props.tutorUserId });
      showSuccess("Tutor invited to submit an offer.");
      setInviteOpen(false);
    } catch (error) {
      showError(error, "Unable to invite this tutor. Please try again.");
    } finally {
      setInvitingRequestId(null);
    }
  };

  return <>
    {loaded && isStudent && <button disabled={saving} onClick={async () => { setSaving(true); await toggleFavourite(props.profileId); setSaving(false); }} style={{ width: "100%", display: "flex", justifyContent: "center", gap: ".5rem", padding: ".75rem", marginBottom: ".75rem", borderRadius: 8, border: "1px solid #fecdd3", background: saved ? "#fff1f2" : "white", color: "#C81B7F", fontWeight: 700 }}><Heart size={17} fill={saved ? "currentColor" : "none"} />{saved ? "Saved to Favourites" : "Save to Favourites"}</button>}
    <button type="button" onClick={openInvitationPicker} style={{ width: "100%", padding: ".85rem", border: "1.5px solid #0329b2", borderRadius: 8, background: "#EEF5FF", color: "#0329b2", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontSize: "0.875rem", boxSizing: "border-box" }}>
      <PlusCircle size={16} aria-hidden="true" /> Invite to My Tuition Requirement
    </button>
    <button type="button" onClick={() => setBooking(true)} style={{ width: "100%", padding: ".8rem", border: "1px solid #bfdbfe", borderRadius: 8, background: "white", color: "#0329B2", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "0.75rem" }}>
      <Calendar size={18} aria-hidden="true" /> Request this tutor directly
    </button>
    {booking && <DirectBookingModal tutorId={props.tutorUserId} tutorUserId={props.tutorUserId} tutorName={props.tutorName} hourlyRate={props.hourlyRate} currency={props.currency} tutorSubjects={props.subjects} tutorTeachingMode={props.teachingMode} tutorCity={props.city} onClose={() => setBooking(false)} onSuccess={() => setBooking(false)} />}
    {inviteOpen && <div role="dialog" aria-modal="true" aria-label="Invite tutor to requirement" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,21,80,.55)", display: "grid", placeItems: "center", padding: 16 }}><div style={{ background: "white", borderRadius: 12, padding: 20, width: "min(100%, 440px)" }}><h2 style={{ color: "#021550", marginTop: 0 }}>Invite {props.tutorName}</h2>{requirements.length ? <div style={{ display: "grid", gap: 8 }}>{requirements.map((requirement) => <button key={requirement._id} type="button" disabled={Boolean(invitingRequestId)} onClick={() => inviteTutor(requirement._id)} style={{ textAlign: "left", padding: 12, border: "1px solid #bfdbfe", borderRadius: 8, background: "#f8faff", color: "#021550", cursor: invitingRequestId ? "wait" : "pointer" }}><strong>{requirement.subject}</strong><br /><small>{invitingRequestId === requirement._id ? "Sending invitation…" : `${requirement.level} · ${requirement.status}`}</small></button>)}</div> : <><p style={{ color: "#52627e" }}>Create a tuition requirement first, then invite this tutor to submit an offer.</p><Link href={`/post-tuition-request?subject=${encodeURIComponent(props.subjects[0] || "")}&city=${encodeURIComponent(props.city || "")}${props.countryCode ? `&country=${encodeURIComponent(props.countryCode)}` : ""}`}>Post Tuition Requirement</Link></>}<button type="button" onClick={() => setInviteOpen(false)} disabled={Boolean(invitingRequestId)} style={{ marginTop: 16 }}>Close</button></div></div>}
  </>;
}
