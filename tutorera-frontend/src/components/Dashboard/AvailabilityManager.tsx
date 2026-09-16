"use client";
// components/dashboard/AvailabilityManager.tsx
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import { UI_COLORS, TEXT_COLORS } from "@/lib/brand";
import { DashCard, DashButton } from "./ui";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

interface WeeklySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export default function AvailabilityManager() {
  const [slots, setSlots] = useState<WeeklySlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/tutors/availability/me")
      .then(res => {
        if (res.data.availability?.weeklySlots) {
          setSlots(res.data.availability.weeklySlots);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addSlot = (day: string) => {
    setSlots(prev => [...prev, { day, startTime: "09:00", endTime: "10:00" }]);
  };

  const removeSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: "startTime" | "endTime", value: string) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.post("/tutors/availability", { weeklySlots: slots });
      showSuccess("Availability saved successfully.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: `3px solid ${UI_COLORS.border}`, borderTopColor: UI_COLORS.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <DashCard padding="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p style={{ fontWeight: 700, color: TEXT_COLORS.primary, fontSize: '0.95rem', margin: 0 }}>Weekly Availability</p>
          <p style={{ color: TEXT_COLORS.muted, fontSize: '0.75rem', margin: '2px 0 0' }}>Set your standard weekly availability. Students will see your next 2 weeks of open slots.</p>
        </div>
        <DashButton variant={saved ? "success" : "primary"} size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Availability"}
        </DashButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {DAYS.map(day => {
          const daySlots = slots.filter(s => s.day === day);
          return (
            <div key={day} style={{ backgroundColor: UI_COLORS.gray50, borderRadius: '0.625rem', padding: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: daySlots.length > 0 ? '0.625rem' : 0 }}>
                <p style={{ fontWeight: 700, color: TEXT_COLORS.primary, fontSize: '0.875rem', margin: 0 }}>{day}</p>
                <DashButton variant="secondary" size="sm" onClick={() => addSlot(day)}>
                  + Add Slot
                </DashButton>
              </div>

              {daySlots.length === 0 && (
                <p style={{ color: TEXT_COLORS.muted, fontSize: '0.75rem', margin: 0 }}>No slots — unavailable this day</p>
              )}

              {daySlots.map((slot, globalIndex) => {
                const index = slots.findIndex((s, i) => s.day === day && slots.filter((ss, ii) => ss.day === day && ii < i).length === daySlots.indexOf(slot));
                const realIndex = slots.indexOf(slot);
                return (
                  <div key={realIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <select value={slot.startTime} onChange={e => updateSlot(realIndex, "startTime", e.target.value)}
                      title="Start time"
                      style={{ padding: '0.4rem 0.6rem', border: `1.5px solid ${UI_COLORS.border}`, borderRadius: '0.375rem', fontSize: '0.8rem', outline: 'none', color: TEXT_COLORS.primary }}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ color: TEXT_COLORS.muted, fontSize: '0.8rem' }}>to</span>
                    <select value={slot.endTime} onChange={e => updateSlot(realIndex, "endTime", e.target.value)}
                      title="End time"
                      style={{ padding: '0.4rem 0.6rem', border: `1.5px solid ${UI_COLORS.border}`, borderRadius: '0.375rem', fontSize: '0.8rem', outline: 'none', color: TEXT_COLORS.primary }}>
                      {TIME_OPTIONS.filter(t => t > slot.startTime).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <DashButton variant="danger" size="sm" onClick={() => removeSlot(realIndex)}
                      aria-label="Remove time slot"
                      style={{ padding: '0.4rem 0.6rem', minHeight: '44px' }}>
                      ×
                    </DashButton>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </DashCard>
  );
}
