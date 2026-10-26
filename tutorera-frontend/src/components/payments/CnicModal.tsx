"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

// Formats up to 13 digits as 12345-1234567-1 while the user types.
export function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

type Props = {
  isOpen: boolean;
  busy?: boolean;
  /** Short line naming what the payment is for, e.g. "Mathematics (O-Level)". */
  subtitle?: string;
  /** Called with the 13 digits only (no dashes). */
  onSubmit: (cnic: string) => void;
  onClose: () => void;
};

/**
 * Asks for the CNIC of the person paying. Swich requires it on every payment
 * session. It lives only in this component's state: never saved to
 * localStorage, never put in a URL, cleared whenever the dialog closes.
 */
export default function CnicModal({ isOpen, busy = false, subtitle, onSubmit, onClose }: Props) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const digits = value.replace(/\D/g, "");
  const valid = digits.length === 13;

  useEffect(() => {
    if (!isOpen) {
      setValue("");
      setTouched(false);
      return;
    }
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid && !busy) onSubmit(digits);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 1100 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cnic-title"
        style={{ background: "white", borderRadius: 14, padding: 24, maxWidth: 440, width: "100%", display: "grid", gap: 14, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#eef5ff", color: "#0329b2", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="cnic-title" style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#021550" }}>Payer identity check</h2>
            {subtitle && <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>{subtitle}</p>}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
          Our payment provider requires the CNIC of the person making this payment. If the student is under 18, a parent or
          adult guardian should enter theirs. It is sent securely to the provider for this payment only and is not saved by TUTORERA.
        </p>

        <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: "0.85rem", color: "#021550" }}>
          Payer&apos;s CNIC (13 digits)
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="42101-1234567-1"
            value={value}
            onChange={(e) => setValue(formatCnic(e.target.value))}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !valid}
            aria-describedby="cnic-help"
            style={{ border: `1.5px solid ${touched && !valid ? "#dc2626" : "#cbd5e1"}`, borderRadius: 8, padding: "10px 12px", font: "inherit", fontSize: "0.95rem", letterSpacing: "0.04em" }}
          />
          <span id="cnic-help" role={touched && !valid ? "alert" : undefined} style={{ fontSize: "0.75rem", fontWeight: 500, color: touched && !valid ? "#dc2626" : "#64748b" }}>
            {touched && !valid ? "Enter all 13 digits of the CNIC." : "Digits only; dashes are added for you."}
          </span>
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ background: "white", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            style={{ background: "#10b981", color: "white", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Starting payment…" : "Continue to payment"}
          </button>
        </div>
      </form>
    </div>
  );
}