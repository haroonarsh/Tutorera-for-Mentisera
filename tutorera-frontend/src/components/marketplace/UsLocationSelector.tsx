import React, { useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";

export interface UsLocation {
  state: string;
  city: string;
  zipCode: string;
}

interface UsLocationSelectorProps {
  value: UsLocation;
  onChange: (loc: UsLocation) => void;
}

export default function UsLocationSelector({ value, onChange }: UsLocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const states = [
    "California", "Texas", "Florida", "New York", "Illinois",
    "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan"
  ];

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          borderRadius: "0.625rem",
          border: "1.5px solid #cbd5e1",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPin size={16} color="#64748b" />
          <span style={{ fontSize: "0.9rem", color: value.state ? "#021550" : "#94a3b8" }}>
            {value.state ? `${value.city ? value.city + ", " : ""}${value.state} ${value.zipCode}` : "Select US Location"}
          </span>
        </div>
        <ChevronDown size={16} color="#64748b" />
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "0.5rem",
          background: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
          zIndex: 50,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#021550", marginBottom: "0.4rem" }}>State</label>
            <select
              value={value.state}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #cbd5e1",
                outline: "none"
              }}
            >
              <option value="">Select State...</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#021550", marginBottom: "0.4rem" }}>City</label>
              <input
                type="text"
                placeholder="e.g. Los Angeles"
                value={value.city}
                onChange={(e) => onChange({ ...value, city: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5e1",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#021550", marginBottom: "0.4rem" }}>ZIP Code</label>
              <input
                type="text"
                placeholder="e.g. 90210"
                value={value.zipCode}
                onChange={(e) => onChange({ ...value, zipCode: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5e1",
                  outline: "none"
                }}
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: "#0329b2",
              color: "white",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer"
            }}
          >
            Confirm Location
          </button>
        </div>
      )}
    </div>
  );
}
