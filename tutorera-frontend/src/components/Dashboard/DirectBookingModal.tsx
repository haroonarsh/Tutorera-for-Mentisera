// components/tutors/DirectBookingModal.tsx
"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import SlotPicker from "@/components/Tutors/SlotPicker";
import styles from "./PostRequestModal.module.css";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const LEVELS = ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"];

interface Slot {
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

interface Props {
  tutorId: string;
  tutorUserId: string;    // ← NEW: the User._id (for availability lookup)
  tutorName: string;
  hourlyRate: number;
  tutorSubjects: string[];
  tutorTeachingMode: "online" | "in-person" | "both";
  tutorCity: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface DirectBookingForm {
  subject: string;
  level: string;
  description: string;
  teachingMode: string;
}

export default function DirectBookingModal({
  tutorId, tutorUserId, tutorName, hourlyRate,
  tutorSubjects, tutorTeachingMode, tutorCity,
  onClose, onSuccess,
}: Props) {
  const [form, setForm] = useState<DirectBookingForm>({
    subject: "", level: "", description: "",
    teachingMode: tutorTeachingMode === "both" ? "" : tutorTeachingMode,
  });
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useFocusTrap(true, onClose);

  function set(key: keyof DirectBookingForm, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    const { subject, level, description, teachingMode } = form;
    if (!subject || !level || !description || !teachingMode) {
      setError("Please fill in all fields."); return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot."); return;
    }
    setLoading(true); setError("");
    try {
      await axiosInstance.post("/requests/direct", {
        tutorId,
        subject, level, description, teachingMode,
        city: tutorCity,
        schedule: `${selectedSlot.dayName} ${selectedSlot.startTime}–${selectedSlot.endTime}`,
        selectedDate: selectedSlot.date,
        selectedStartTime: selectedSlot.startTime,
        selectedEndTime: selectedSlot.endTime,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to send booking request. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <div ref={modalRef} className={styles.modal} style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ width: 64, height: 64, backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>✅</span>
          </div>
          <h2 className={styles.modalTitle} style={{ marginBottom: '0.75rem' }}>Request Sent!</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Your booking request for <strong>{selectedSlot?.dayName} at {selectedSlot?.startTime}</strong> has been sent to <strong>{tutorName}</strong>. You'll be notified once they respond.
          </p>
          <button onClick={onClose} className={styles.submitBtn} style={{ width: '100%' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Book a session">
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Book {tutorName.split(' ')[0]}</h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Rate */}
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>Tutor's Rate</span>
            <span style={{ fontSize: '0.95rem', color: '#1a1a2e', fontWeight: 800 }}>Rs. {hourlyRate.toLocaleString()}/hr</span>
          </div>

          {/* Subject + Level */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="db-subject">Subject *</label>
              <select id="db-subject" aria-label="Subject" className={styles.select}
                value={form.subject} onChange={e => set("subject", e.target.value)}>
                <option value="">Select subject</option>
                {tutorSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="db-level">Level *</label>
              <select id="db-level" aria-label="Level" className={styles.select}
                value={form.level} onChange={e => set("level", e.target.value)}>
                <option value="">Select level</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Message */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="db-desc">Message to Tutor *</label>
            <textarea id="db-desc" className={styles.textarea} rows={2}
              placeholder="Tell the tutor what you need help with..."
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Teaching mode */}
          {tutorTeachingMode === "both" ? (
            <div className={styles.field} style={{ marginBottom: '1rem' }}>
              <label className={styles.label} htmlFor="db-mode">Teaching Mode *</label>
              <select id="db-mode" aria-label="Teaching Mode" className={styles.select}
                value={form.teachingMode} onChange={e => set("teachingMode", e.target.value)}>
                <option value="">Select mode</option>
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>
          ) : (
            <div className={styles.field} style={{ marginBottom: '1rem' }}>
              <label className={styles.label}>Teaching Mode</label>
              <div style={{ padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize', backgroundColor: '#f9fafb' }}>
                {tutorTeachingMode}
              </div>
            </div>
          )}

          {/* ── Slot Picker — replaces schedule text input ── */}
          <div>
            <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
              Select Time Slot *
            </label>
            <SlotPicker
              tutorUserId={tutorUserId}
              selectedSlot={selectedSlot}
              onSlotSelect={setSelectedSlot}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !selectedSlot} className={styles.submitBtn}
            style={{ opacity: !selectedSlot ? 0.6 : 1 }}>
            {loading ? "Sending…" : "Send Booking Request"}
          </button>
        </div>
      </div>
    </div>
  );
}