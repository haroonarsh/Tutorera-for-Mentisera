"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Save, AlertCircle } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

const C = UI_COLORS;

interface DisciplineSubjectMap {
  _id: string;
  discipline: string;
  eligibleSubjects: string[];
  eligibleLevels: string[];
  isActive: boolean;
  notes: string;
}

export default function TeachingEligibilityPage() {
  const [maps, setMaps] = useState<DisciplineSubjectMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ discipline: "", eligibleSubjects: "", eligibleLevels: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchMaps = async () => {
    try {
      const res = await api.get("/admin/discipline-subject-maps");
      setMaps(res.data.maps || []);
    } catch (err) {
      showError(err, "Failed to load discipline-subject maps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaps(); }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ discipline: "", eligibleSubjects: "", eligibleLevels: "", notes: "" });
  };

  const handleSubmit = async () => {
    if (!form.discipline.trim()) {
      showError("A discipline name is required.");
      return;
    }
    const payload = {
      discipline: form.discipline.trim(),
      eligibleSubjects: form.eligibleSubjects.split(",").map(s => s.trim()).filter(Boolean),
      eligibleLevels: form.eligibleLevels.split(",").map(s => s.trim()).filter(Boolean),
      notes: form.notes,
    };
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/discipline-subject-maps/${editingId}`, payload);
        showSuccess("Teaching eligibility rule updated.");
      } else {
        await api.post("/admin/discipline-subject-maps", payload);
        showSuccess("Teaching eligibility rule created.");
      }
      resetForm();
      fetchMaps();
    } catch (err) {
      showError(err, "Failed to save discipline mapping");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (map: DisciplineSubjectMap) => {
    setForm({
      discipline: map.discipline,
      eligibleSubjects: map.eligibleSubjects.join(", "),
      eligibleLevels: map.eligibleLevels.join(", "),
      notes: map.notes || "",
    });
    setEditingId(map._id);
    setShowForm(true);
  };

  const handleToggleActive = async (map: DisciplineSubjectMap) => {
    try {
      await api.put(`/admin/discipline-subject-maps/${map._id}`, { isActive: !map.isActive });
      showSuccess(map.isActive ? "Teaching eligibility rule deactivated." : "Teaching eligibility rule activated.");
      fetchMaps();
    } catch (err) {
      showError(err, "Failed to update mapping");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discipline mapping? Tutors with this discipline will no longer see a discipline-match hint during onboarding or review.")) return;
    try {
      await api.delete(`/admin/discipline-subject-maps/${id}`);
      showSuccess("Teaching eligibility rule removed.");
      fetchMaps();
    } catch (err) {
      showError(err, "Failed to delete mapping");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading discipline mappings...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>Teaching Eligibility</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", background: C.accent, color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 600 }}
          >
            <Plus size={18} /> New Rule
          </button>
        )}
      </div>
      <p style={{ color: TEXT_COLORS.muted, fontSize: "0.9rem", marginBottom: "1.5rem", maxWidth: 720 }}>
        This is a hint, not an auto-approval: it flags which subjects a tutor&apos;s declared discipline is expected to cover (e.g. Computer Science → Computer Science, Programming, Computing, Information Technology), so a reviewing admin can see at a glance whether a subject request matches the tutor&apos;s qualification or is an adjacent subject that needs supporting evidence. Tutor-selected subjects always still require explicit admin approval regardless of this mapping.
      </p>

      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>{editingId ? "Edit Rule" : "Create Teaching Eligibility Rule"}</h3>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Discipline *</label>
            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={form.discipline}
              onChange={e => setForm({ ...form, discipline: e.target.value })}
              disabled={!!editingId}
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${C.border}`, borderRadius: "0.375rem", fontSize: "0.875rem" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Eligible subjects (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Computer Science, Programming, Computing, Information Technology"
              value={form.eligibleSubjects}
              onChange={e => setForm({ ...form, eligibleSubjects: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${C.border}`, borderRadius: "0.375rem", fontSize: "0.875rem" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Eligible levels (comma separated, optional)</label>
            <input
              type="text"
              placeholder="e.g. O-Level, A-Level, University"
              value={form.eligibleLevels}
              onChange={e => setForm({ ...form, eligibleLevels: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${C.border}`, borderRadius: "0.375rem", fontSize: "0.875rem" }}
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${C.border}`, borderRadius: "0.375rem", fontSize: "0.875rem", fontFamily: "inherit", minHeight: "3rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button onClick={resetForm} style={{ padding: "0.625rem 1rem", border: `1px solid ${C.border}`, background: C.surface, borderRadius: "0.375rem", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", background: saving ? C.gray500 : STATUS_COLORS.success.color, color: "white", border: "none", borderRadius: "0.375rem", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600 }}
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </div>
      )}

      {maps.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: STATUS_COLORS.neutral.bg, borderRadius: "0.75rem", color: TEXT_COLORS.muted }}>
          <AlertCircle size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
          <p style={{ margin: 0 }}>No discipline mappings yet. Create one to help admins review subject requests faster.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {maps.map((map) => (
            <div key={map._id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "1rem", alignItems: "center", padding: "1rem", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.75rem", opacity: map.isActive ? 1 : 0.55 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{map.discipline} {!map.isActive && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: STATUS_COLORS.neutral.color }}>(inactive)</span>}</div>
                <div style={{ fontSize: "0.875rem", color: TEXT_COLORS.muted }}>Subjects: {map.eligibleSubjects.join(", ") || "None"}</div>
                {map.eligibleLevels.length > 0 && <div style={{ fontSize: "0.875rem", color: TEXT_COLORS.muted }}>Levels: {map.eligibleLevels.join(", ")}</div>}
                {map.notes && <div style={{ fontSize: "0.875rem", color: C.gray500, marginTop: "0.25rem" }}>{map.notes}</div>}
              </div>
              <button onClick={() => handleToggleActive(map)} title={map.isActive ? "Deactivate" : "Activate"} style={{ padding: "0.5rem 0.75rem", background: STATUS_COLORS.neutral.bg, border: `1px solid ${C.border}`, borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                {map.isActive ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => handleEdit(map)} title="Edit mapping" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.5rem 0.75rem", background: STATUS_COLORS.neutral.bg, border: `1px solid ${C.border}`, borderRadius: "0.375rem", cursor: "pointer" }}>
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(map._id)} title="Delete mapping" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.5rem 0.75rem", background: STATUS_COLORS.danger.bg, border: `1px solid ${STATUS_COLORS.danger.border}`, borderRadius: "0.375rem", cursor: "pointer", color: STATUS_COLORS.danger.color }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
