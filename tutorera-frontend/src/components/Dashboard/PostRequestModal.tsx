// components/dashboard/PostRequestModal.tsx
"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { PostRequestPayload } from "@/types/dashboard";
import styles from "./PostRequestModal.module.css";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Urdu", "Computer Science", "Islamiyat", "Pakistan Studies", "Economics", "Accounting"];
const LEVELS   = ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University"];
const CITIES   = ["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar",
  "Quetta", "Faisalabad", "Multan", "Sialkot", "Gujranwala"];

const EMPTY: PostRequestPayload = {
  subject: "", level: "", description: "",
  budget: "", teachingMode: "", city: "", schedule: "",
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostRequestModal({ onClose, onSuccess }: Props) {
  const [form, setForm]       = useState<PostRequestPayload>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function set(key: keyof PostRequestPayload, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    const { subject, level, description, budget, teachingMode, city, schedule } = form;
    if (!subject || !level || !description || !budget || !teachingMode || !city || !schedule) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post("/requests", {
        ...form,
        budget: Number(budget),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg || "Failed to post request. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Post a tuition request">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Post a Tuition Request</h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="req-subject">Subject *</label>
              <select id="req-subject" aria-label="Subject" className={styles.select}
                value={form.subject} onChange={(e) => set("subject", e.target.value)}>
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="req-level">Level *</label>
              <select id="req-level" aria-label="Level" className={styles.select}
                value={form.level} onChange={(e) => set("level", e.target.value)}>
                <option value="">Select level</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="req-desc">Description *</label>
            <textarea id="req-desc" className={styles.textarea}
              placeholder="Describe what you need help with, your current level, exam dates, etc."
              rows={3} value={form.description}
              onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="req-budget">Budget (PKR/hr) *</label>
              <input id="req-budget" type="number" className={styles.input}
                placeholder="e.g. 1500" value={form.budget}
                onChange={(e) => set("budget", e.target.value)} min={0} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="req-mode">Teaching Mode *</label>
              <select id="req-mode" aria-label="Teaching Mode" className={styles.select}
                value={form.teachingMode} onChange={(e) => set("teachingMode", e.target.value)}>
                <option value="">Select mode</option>
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="req-city">City *</label>
              <select id="req-city" aria-label="City" className={styles.select}
                value={form.city} onChange={(e) => set("city", e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="req-schedule">Preferred Schedule *</label>
              <input id="req-schedule" type="text" className={styles.input}
                placeholder="e.g. Weekdays 6PM – 8PM"
                value={form.schedule} onChange={(e) => set("schedule", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
            {loading ? "Posting…" : "Post Request"}
          </button>
        </div>
      </div>
    </div>
  );
}