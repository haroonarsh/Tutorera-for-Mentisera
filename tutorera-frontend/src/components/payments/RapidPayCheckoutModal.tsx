"use client";

import { useEffect, useRef } from "react";

interface RapidPayCheckoutModalProps {
  sessionId: string;
  clientSecret: string;
  publishableKey: string;
  onSuccess: (data: { sessionId: string }) => void;
  onPending: (data: { sessionId: string }) => void;
  onError: (error: { message?: string }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    RapidPay?: (publishableKey: string) => {
      mountCheckout: (
        selector: string,
        options: {
          clientSecret: string;
          amount?: number;
          currency?: string;
          merchantName?: string;
          onSuccess: (data: { sessionId: string }) => void;
          onPending: (data: { sessionId: string }) => void;
          onError: (error: { message?: string }) => void;
        }
      ) => void;
    };
  }
}

const SDK_URL = "https://secure.rapid-gateway.com/sdk/v1/rapidpay.js";

export default function RapidPayCheckoutModal({
  sessionId,
  clientSecret,
  publishableKey,
  onSuccess,
  onPending,
  onError,
  onClose,
}: RapidPayCheckoutModalProps) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    function mountCheckout() {
      if (!window.RapidPay) return;
      const rp = window.RapidPay(publishableKey);
      rp.mountCheckout("#rp-checkout-container", {
        clientSecret,
        merchantName: "TUTORERA",
        onSuccess,
        onPending,
        onError,
      });
    }

    if (window.RapidPay) {
      mountCheckout();
      return;
    }

    // Load the SDK once and mount after it's ready.
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", mountCheckout, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = mountCheckout;
    document.head.appendChild(script);
  }, [clientSecret, publishableKey, onSuccess, onPending, onError]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "1rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#021550" }}>Complete Payment</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "#94a3b8", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div id="rp-checkout-container" style={{ minHeight: 300 }} />
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.75rem", textAlign: "center" }}>
          Secured by RapidPay · Card data never touches TUTORERA servers (PCI SAQ A)
        </p>
      </div>
    </div>
  );
}
