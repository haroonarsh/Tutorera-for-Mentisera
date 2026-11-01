"use client";

import api from "@/lib/axios";
import { useEffect, useState } from "react";

type Meeting = { provider: "google_meet" | "microsoft_teams"; url: string; updatedAt: string };
type Props = {
  bookingId: string;
  role: "student" | "tutor" | "admin";
  teachingMode?: string;
  status: string;
  paymentStatus?: string;
};

export default function BookingMeetingPanel({ bookingId, role, teachingMode, status, paymentStatus }: Props) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setMeeting(null);
    setUrl("");
    setLoaded(false);
    setError("");
  }, [bookingId]);

  const eligible = teachingMode !== "in-person" && ["upcoming", "ongoing"].includes(status) && paymentStatus === "confirmed";
  if (!eligible) return null;

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await api.get(`/bookings/${bookingId}/meeting`);
      setMeeting(response.data.meeting ?? null);
      setLoaded(true);
    } catch {
      setError("Meeting details are unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.put(`/bookings/${bookingId}/meeting`, { url });
      setUrl("");
      const response = await api.get(`/bookings/${bookingId}/meeting`);
      setMeeting(response.data.meeting ?? null);
      setLoaded(true);
    } catch {
      setError("Could not save the meeting link. Check that it is a valid Google Meet or Microsoft Teams URL.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Online class meeting" style={{ marginTop: 12, padding: 14, border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Online class</h3>
      {!loaded && <button type="button" onClick={load} disabled={busy}>{busy ? "Loading…" : "View meeting details"}</button>}
      {loaded && (meeting ? (
        <p style={{ margin: "8px 0" }}>
          {meeting.provider === "google_meet" ? "Google Meet" : "Microsoft Teams"} ·{" "}
          <a href={meeting.url} target="_blank" rel="noopener noreferrer">Join class (opens in a new tab)</a>
        </p>
      ) : <p style={{ margin: "8px 0" }}>Your tutor has not shared a meeting link yet.</p>)}
      {role === "tutor" && (
        <form onSubmit={save} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          <label style={{ flex: "1 1 220px" }}>Meeting URL
            <input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" style={{ display: "block", width: "100%", padding: 8 }} />
          </label>
          <button type="submit" disabled={busy || !url.trim()}>{busy ? "Saving…" : "Save meeting link"}</button>
        </form>
      )}
      {loaded && <button type="button" onClick={load} disabled={busy} style={{ marginTop: 8 }}>{busy ? "Refreshing…" : "Refresh meeting details"}</button>}
      {error && <p role="alert" style={{ color: "#b91c1c", marginTop: 8 }}>{error}</p>}
      <p style={{ fontSize: 12, color: "#475569", margin: "8px 0 0" }}>Only share the class meeting URL. Do not include personal contact details.</p>
    </section>
  );
}
