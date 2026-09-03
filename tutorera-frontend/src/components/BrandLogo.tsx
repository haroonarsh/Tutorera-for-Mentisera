import Image from "next/image";
import Link from "next/link";

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
  const content = (
    <>
      <Image
        src="/tutorera-icon-192.png"
        alt=""
        width={token.image}
        height={token.image}
        sizes={`${token.image}px`}
        className={imageClassName}
        priority={priority}
        style={{ objectFit: "contain", flexShrink: 0 }}
      />
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
