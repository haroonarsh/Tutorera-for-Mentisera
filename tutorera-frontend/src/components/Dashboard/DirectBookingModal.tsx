// components/tutors/DirectBookingModal.tsx
"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import styles from "@/components/dashboard/PostRequestModal.module.css";

const LEVELS = ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"];

interface Props {
  tutorId: string;
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
  schedule: string;
}

const EMPTY: DirectBookingForm = {
  subject: "", level: "", description: "", teachingMode: "", schedule: "",
};

export default function DirectBookingModal({
  tutorId, tutorName, hourlyRate, tutorSubjects, tutorTeachingMode, tutorCity,
  onClose, onSuccess,
}: Props) {
  const [form, setForm] = useState<DirectBookingForm>({
    ...EMPTY,
    teachingMode: tutorTeachingMode === "both" ? "" : tutorTeachingMode,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function set(key: keyof DirectBookingForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    const { subject, level, description, teachingMode, schedule } = form;
    if (!subject || !level || !description || !teachingMode || !schedule) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post("/requests/direct", {
        tutorId,
        subject,
        level,
        description,
        teachingMode,
        city: tutorCity,
        schedule,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg || "Failed to send booking request. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <div className={styles.modal} style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ width: 64, height: 64, backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>✅</span>
          </div>
          <h2 className={styles.modalTitle} style={{ marginBottom: '0.75rem' }}>Request Sent!</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Your booking request has been sent to <strong>{tutorName}</strong>. You'll be notified as soon as they respond — usually within a day.
          </p>
          <button onClick={onClose} className={styles.submitBtn} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Book this tutor directly">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Book {tutorName.split(' ')[0]}</h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Rate notice — read only, no negotiation */}
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>Tutor's Rate</span>
            <span style={{ fontSize: '0.95rem', color: '#1a1a2e', fontWeight: 800 }}>Rs. {hourlyRate.toLocaleString()}/hr</span>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="db-subject">Subject *</label>
              <select id="db-subject" aria-label="Subject" className={styles.select}
                value={form.subject} onChange={(e) => set("subject", e.target.value)}>
                <option value="">Select subject</option>
                {tutorSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="db-level">Level *</label>
              <select id="db-level" aria-label="Level" className={styles.select}
                value={form.level} onChange={(e) => set("level", e.target.value)}>
                <option value="">Select level</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="db-desc">Message to Tutor *</label>
            <textarea id="db-desc" className={styles.textarea}
              placeholder="Tell the tutor what you need help with, your current level, exam dates, etc."
              rows={3} value={form.description}
              onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className={styles.row}>
            {/* Only show mode selector if tutor offers both — otherwise it's fixed */}
            {tutorTeachingMode === "both" ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="db-mode">Teaching Mode *</label>
                <select id="db-mode" aria-label="Teaching Mode" className={styles.select}
                  value={form.teachingMode} onChange={(e) => set("teachingMode", e.target.value)}>
                  <option value="">Select mode</option>
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
            ) : (
              <div className={styles.field}>
                <label className={styles.label}>Teaching Mode</label>
                <div style={{ padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize', backgroundColor: '#f9fafb' }}>
                  {tutorTeachingMode}
                </div>
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="db-schedule">Preferred Schedule *</label>
              <input id="db-schedule" type="text" className={styles.input}
                placeholder="e.g. Weekdays 6PM – 8PM"
                value={form.schedule} onChange={(e) => set("schedule", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
            {loading ? "Sending…" : "Send Booking Request"}
          </button>
        </div>
      </div>
    </div>
  );
}