"use client";

export default function SkipLink() {
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: "absolute",
          top: "-100%",
          left: "1rem",
          background: "#021550",
          color: "white",
          padding: "0.75rem 1.25rem",
          borderRadius: "0 0 0.5rem 0.5rem",
          fontWeight: 700,
          fontSize: "0.875rem",
          textDecoration: "none",
          zIndex: 99999,
          transition: "top 0.15s",
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.top = "0"; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.top = "-100%"; }}
      >
        Skip to main content
      </a>
      <style>{`.skip-link:focus { outline: 3px solid #fbbf24; outline-offset: 2px; }`}</style>
    </>
  );
}
