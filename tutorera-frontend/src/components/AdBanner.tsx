"use client";

import { useEffect, useRef, useState } from "react";

export type AdFormat =
  | "auto"
  | "rectangle"
  | "responsive"
  | "leaderboard"
  | "display"
  | "fluid";

export interface AdBannerProps {
  slot: string;
  format?: AdFormat;
  className?: string;
  style?: React.CSSProperties;
  layout?: "horizontal" | "vertical" | "fluid";
  label?: string;
  responsive?: boolean;
}

const ADSENSE_CLIENT = "ca-pub-2559940686225219";

const containerStyle: Record<string, React.CSSProperties> = {
  auto: {
    display: "block",
    width: "100%",
    minHeight: "90px",
    margin: "1.5rem 0",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    border: "1px dashed #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  rectangle: {
    display: "block",
    width: "300px",
    height: "250px",
    margin: "1.5rem auto",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    border: "1px dashed #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  leaderboard: {
    display: "block",
    width: "728px",
    height: "90px",
    margin: "1.5rem auto",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    border: "1px dashed #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  responsive: {
    display: "block",
    width: "100%",
    minHeight: "250px",
    margin: "1.5rem 0",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    border: "1px dashed #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  fluid: {
    display: "block",
    width: "100%",
    minHeight: "100px",
    margin: "1.5rem 0",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    border: "1px dashed #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  display: {
    display: "block",
    width: "100%",
    minHeight: "250px",
    margin: "1.5rem 0",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    border: "1px dashed #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
};

function hasAdConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("tutorera_cookie_consent");
    if (!stored) return false;
    const consent = JSON.parse(stored);
    const marketing = consent.marketing === true;
    const analytics = consent.analytics === true;
    return marketing || analytics;
  } catch {
    return false;
  }
}

export default function AdBanner({
  slot,
  format = "auto",
  className,
  style,
  layout = format === "fluid" ? "fluid" : "horizontal",
  label = "Advertisement",
  responsive = true,
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      setConsentGiven(hasAdConsent());
    };

    checkConsent();

    const handler = () => checkConsent();
    window.addEventListener("tutorera-consent-updated", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("tutorera-consent-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    if (!consentGiven) return;

    const pushAd = () => {
      if (typeof window !== "undefined" && window.adsbygoogle && adRef.current) {
        try {
          (window.adsbygoogle as unknown[]).push({});
        } catch {
          // Silent fail - ad may not load in dev or if blocked
        }
      }
    };

    const timer = setTimeout(pushAd, 100);
    return () => clearTimeout(timer);
  }, [consentGiven]);

  const baseAttrs: Record<string, string | boolean> = {
    "data-ad-client": ADSENSE_CLIENT,
    "data-ad-slot": slot,
    "data-ad-format": format,
    "data-full-width-responsive": responsive,
    "data-layout": layout,
  };

  if (!consentGiven) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle[format],
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.6,
        }}
        aria-label={label}
      >
        <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
          Ad will load after cookie consent
        </span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ ...containerStyle[format], ...style }}
      aria-label={label}
      role="region"
    >
      {process.env.NODE_ENV !== "production" && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "8px",
            fontSize: "0.6rem",
            color: "#94a3b8",
            fontWeight: 600,
          }}
        >
          Ad
        </div>
      )}
      <ins
        ref={adRef as React.Ref<HTMLModElement>}
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          minHeight: format === "rectangle" ? "250px" : "90px",
        }}
        {...baseAttrs}
      />
    </div>
  );
}
