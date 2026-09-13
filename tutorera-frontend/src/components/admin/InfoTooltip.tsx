"use client";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { UI_COLORS } from "@/lib/brand";

const C = UI_COLORS;

// Small hover/focus-triggered help icon for admin form fields where the
// label alone doesn't explain how a value is actually used downstream
// (e.g. which formula it feeds, or which other config it interacts with).
export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", verticalAlign: "middle", marginLeft: "0.35rem" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More information"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        style={{ background: "none", border: "none", padding: 0, cursor: "help", display: "flex", color: C.gray500 }}
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "140%",
            left: "50%",
            transform: "translateX(-50%)",
            background: C.primary,
            color: C.surface,
            fontSize: "0.72rem",
            fontWeight: 500,
            lineHeight: 1.5,
            padding: "0.5rem 0.7rem",
            borderRadius: "6px",
            width: "220px",
            textAlign: "left",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            whiteSpace: "normal",
          }}
        >
          {text}
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `5px solid ${C.primary}`,
            }}
          />
        </span>
      )}
    </span>
  );
}
