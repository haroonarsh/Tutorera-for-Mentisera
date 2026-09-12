"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Save, X, AlertCircle } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";

interface FeatureFlag {
  _id: string;
  key: string;
  enabled: boolean;
  scope: "global" | "country";
  countryCodes?: string[];
  description?: string;
  updatedBy?: { name: string };
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    key: "",
    description: "",
    enabled: false,
    scope: "global" as const,
    countryCodes: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const fetchFlags = async () => {
    try {
      const res = await api.get("/api/feature-flags/admin/list");
      setFlags(res.data.flags || []);
    } catch (err) {
      showError("Failed to load feature flags");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleSubmit = async () => {
    if (!form.key.trim()) {
      showError("Feature flag key is required");
      return;
    }
    if (form.scope === "country" && form.countryCodes.length === 0) {
      showError("Please select at least one country for country-scoped flags");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/feature-flags/admin/${form.key.toUpperCase()}`, {
        enabled: form.enabled,
        scope: form.scope,
        countryCodes: form.countryCodes,
        description: form.description,
      });
      showSuccess(editingId ? "Feature flag updated" : "Feature flag created");
      setShowForm(false);
      setEditingId(null);
      setForm({ key: "", description: "", enabled: false, scope: "global", countryCodes: [] });
      fetchFlags();
    } catch (err) {
      showError("Failed to save feature flag");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (flag: FeatureFlag) => {
    setForm({
      key: flag.key,
      description: flag.description || "",
      enabled: flag.enabled,
      scope: flag.scope,
      countryCodes: flag.countryCodes || [],
    });
    setEditingId(flag._id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ key: "", description: "", enabled: false, scope: "global", countryCodes: [] });
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      await api.put(`/api/feature-flags/admin/${flag.key}`, {
        enabled: !flag.enabled,
        scope: flag.scope,
        countryCodes: flag.countryCodes,
        description: flag.description,
      });
      showSuccess(flag.enabled ? "Flag disabled" : "Flag enabled");
      fetchFlags();
    } catch (err) {
      showError("Failed to toggle flag");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading feature flags...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>Feature Flags</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Plus size={18} /> New Feature Flag
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                Flag Key {editingId && "(Read-only)"}
              </label>
              <input
                type="text"
                placeholder="e.g., PREMIUM_MATCHING"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
                disabled={!!editingId}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  opacity: editingId ? 0.7 : 1,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Description</label>
              <textarea
                placeholder="Describe what this flag controls"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  minHeight: "3rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Scope</label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    checked={form.scope === "global"}
                    onChange={() => setForm({ ...form, scope: "global", countryCodes: [] })}
                  />
                  Global
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    checked={form.scope === "country"}
                    onChange={() => setForm({ ...form, scope: "country" })}
                  />
                  Country-Scoped
                </label>
              </div>
            </div>
            {form.scope === "country" && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Country Codes</label>
                <input
                  type="text"
                  placeholder="e.g., PK,US,GB (comma-separated ISO codes)"
                  value={form.countryCodes.join(",")}
                  onChange={(e) => setForm({ ...form, countryCodes: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean) })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                id="enabled"
              />
              <label htmlFor="enabled" style={{ cursor: "pointer" }}>
                Enable this flag
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={handleCancel}
              style={{
                padding: "0.625rem 1rem",
                border: "1px solid #d1d5db",
                background: "white",
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
                background: saving ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Flag"}
            </button>
          </div>
        </div>
      )}

      {flags.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "#f9fafb",
            borderRadius: "0.75rem",
            color: "#6b7280",
          }}
        >
          <AlertCircle size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
          No feature flags yet. Create one to get started.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {flags.map((flag) => (
            <div
              key={flag._id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: "1rem",
                alignItems: "center",
                padding: "1rem",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{flag.key}</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{flag.description}</div>
                {flag.scope === "country" && (
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                    🌍 {flag.countryCodes?.join(", ")}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#9ca3af" }}>
                {flag.updatedBy?.name && `Updated by ${flag.updatedBy.name}`}
              </div>
              <button
                onClick={() => toggleFlag(flag)}
                style={{
                  padding: "0.5rem 1rem",
                  background: flag.enabled ? "#dcfce7" : "#fee2e2",
                  color: flag.enabled ? "#15803d" : "#991b1b",
                  border: `1px solid ${flag.enabled ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                {flag.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                onClick={() => handleEdit(flag)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.5rem 0.75rem",
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                <Edit2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
