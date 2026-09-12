"use client";
import React from "react";

export default function PaymentProvidersPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#021550", marginBottom: "1rem" }}>
        Payment Providers
      </h1>
      <p style={{ color: "#4b5563" }}>
        Manage and configure global payment gateways such as Safepay and Stripe here.
      </p>
      
      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
        {/* Placeholder cards for payment providers */}
        <div style={{ padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "white" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#111827" }}>Stripe</h2>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Active in: US, AE, SA, IN</p>
          <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "0.25rem", cursor: "pointer" }}>
            Configure
          </button>
        </div>

        <div style={{ padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "white" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#111827" }}>Safepay</h2>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Active in: PK</p>
          <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "0.25rem", cursor: "pointer" }}>
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}
