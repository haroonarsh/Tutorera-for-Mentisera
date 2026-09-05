"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type BrandLogoProps = {
  href?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  imageClassName?: string;
  showByline?: boolean;
  priority?: boolean;
};

const sizeMap = {
  sm: { image: 36, word: "1rem", byline: "0.62rem" },
  md: { image: 46, word: "1.12rem", byline: "0.7rem" },
  lg: { image: 58, word: "1.35rem", byline: "0.78rem" },
};

function TutoreraLogoSvg({ size = 44 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{ flexShrink: 0, display: "block" }}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#021550" />
      <path
        d="M13 17.5c7.1-1.8 13.4-.4 19 4.3v29c-5.6-4.7-11.9-6.1-19-4.3v-29Z"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M51 17.5c-7.1-1.8-13.4-.4-19 4.3v29c5.6-4.7 11.9-6.1 19-4.3v-29Z"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M32 22v29" stroke="#0329B2" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="14" r="6" fill="#C81B7F" />
    </svg>
  );
}

export default function BrandLogo({
  href = "/",
  variant = "dark",
  size = "md",
  className,
  imageClassName,
  showByline = true,
  priority = false,
}: BrandLogoProps) {
  const token = sizeMap[size];
  const [useFallback, setUseFallback] = useState(false);

  const content = (
    <>
      {!useFallback ? (
        <Image
          src="/tutorera-icon-192.png"
          alt="TUTORERA"
          width={token.image}
          height={token.image}
          sizes={`${token.image}px`}
          className={imageClassName}
          priority={priority}
          unoptimized
          onError={() => setUseFallback(true)}
          style={{ objectFit: "contain", flexShrink: 0, display: "block" }}
        />
      ) : (
        <TutoreraLogoSvg size={token.image} />
      )}
      <span style={{ display: "grid", gap: 2, lineHeight: 1 }}>
        <strong style={{
          color: variant === "light" ? "#FFFFFF" : "var(--color-heading)",
          fontSize: token.word,
          fontWeight: 950,
          letterSpacing: "-0.045em",
        }}>
          TUTORERA<span aria-hidden="true" style={{ color: "var(--color-digital-blue)" }}>®</span>
        </strong>
        {showByline && (
          <small style={{
            color: variant === "light" ? "rgba(255,255,255,0.72)" : "var(--color-muted)",
            fontSize: token.byline,
            fontWeight: 850,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            by MENTISERA
          </small>
        )}
      </span>
    </>
  );

  return (
    <Link
      href={href}
      className={className}
      aria-label="TUTORERA home"
      style={{ display: "inline-flex", alignItems: "center", gap: "0.72rem", color: "inherit", textDecoration: "none" }}
    >
      {content}
    </Link>
  );
}
