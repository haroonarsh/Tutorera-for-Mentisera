"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, X, Save, AlertCircle } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

const C = UI_COLORS;

interface Subject {
  _id: string;
  name: string;
  slug: string;
  category: string;
  level: string[];
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export default function CurriculumPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState({ category: "", isActive: true });
  const [form, setForm] = useState({
    name: "",
    category: "",
    level: [] as string[],
    description: "",
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const EDUCATION_LEVELS = ["Primary", "Secondary", "High School", "University", "Professional"];

  const fetchSubjects = async (query?: string) => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append("category", filter.category);
      params.append("isActive", String(filter.isActive));

      const res = await api.get(`/admin/subjects?${params.toString()}`);
      setSubjects(res.data.subjects || []);
    } catch (err) {
      showError("Failed to load subjects");
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/subjects/categories");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchCategories(), fetchSubjects()]);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [filter]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      showError("Name and category are required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/subjects/${editingId}`, form);
        showSuccess("Subject updated successfully");
      } else {
        await api.post("/admin/subjects", form);
        showSuccess("Subject created successfully");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", category: "", level: [], description: "", sortOrder: 0 });
      fetchSubjects();
    } catch (err) {
      showError("Failed to save subject");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setForm({
      name: subject.name,
      category: subject.category,
      level: subject.level,
      description: subject.description,
      sortOrder: subject.sortOrder,
    });
    setEditingId(subject._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      await api.delete(`/admin/subjects/${id}`);
      showSuccess("Subject deleted successfully");
      fetchSubjects();
    } catch (err) {
      showError("Failed to delete subject");
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", category: "", level: [], description: "", sortOrder: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading curriculum...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>Curriculum & Subjects</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: C.accent,
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Plus size={18} /> New Subject
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "0.75rem",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
            {editingId ? "Edit Subject" : "Create New Subject"}
          </h3>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Subject Name *</label>
              <input
                type="text"
                placeholder="e.g., Mathematics, English, Biology"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Category *</label>
              <input
                type="text"
                placeholder="e.g., Science, Languages, Mathematics"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="categories"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Education Levels</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {EDUCATION_LEVELS.map((level) => (
                <label
                  key={level}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    border: `1px solid ${form.level.includes(level) ? C.accent : C.border}`,
                    background: form.level.includes(level) ? C.accentLight : C.surface,
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.level.includes(level)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, level: [...form.level, level] });
                      } else {
                        setForm({ ...form, level: form.level.filter((l) => l !== level) });
                      }
                    }}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Description</label>
            <textarea
              placeholder="Describe this subject"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: `1px solid ${C.border}`,
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                minHeight: "3rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: `1px solid ${C.border}`,
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={handleCancel}
              style={{
                padding: "0.625rem 1rem",
                border: `1px solid ${C.border}`,
                background: C.surface,
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1rem",
                background: saving ? C.gray500 : STATUS_COLORS.success.color,
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Subject"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          style={{
            padding: "0.5rem",
            border: `1px solid ${C.border}`,
            borderRadius: "0.375rem",
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={String(filter.isActive)}
          onChange={(e) => setFilter({ ...filter, isActive: e.target.value === "true" })}
          style={{
            padding: "0.5rem",
            border: `1px solid ${C.border}`,
            borderRadius: "0.375rem",
          }}
        >
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: STATUS_COLORS.neutral.bg,
            borderRadius: "0.75rem",
            color: TEXT_COLORS.muted,
          }}
        >
          <AlertCircle size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
          No subjects found. Create one to get started.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {subjects.map((subject) => (
            <div
              key={subject._id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: "1rem",
                alignItems: "center",
                padding: "1rem",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "0.75rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{subject.name}</div>
                <div style={{ fontSize: "0.875rem", color: TEXT_COLORS.muted }}>
                  {subject.category} • {subject.level.join(", ")}
                </div>
                {subject.description && (
                  <div style={{ fontSize: "0.875rem", color: C.gray500, marginTop: "0.25rem" }}>
                    {subject.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleEdit(subject)}
                title="Edit subject"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.5rem 0.75rem",
                  background: STATUS_COLORS.neutral.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(subject._id)}
                title="Delete subject"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.5rem 0.75rem",
                  background: STATUS_COLORS.danger.bg,
                  border: `1px solid ${STATUS_COLORS.danger.border}`,
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  color: STATUS_COLORS.danger.color,
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
