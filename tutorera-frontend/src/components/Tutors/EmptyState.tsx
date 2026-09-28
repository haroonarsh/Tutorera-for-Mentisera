import Link from "next/link";
import styles from "./Emptystate.module.css";

interface EmptyStateProps {
  onReset: () => void;
  // Only offered when the current filter is home / in-person; must be an
  // explicit user action per spec §31 ("do not silently change teaching mode").
  onIncludeOnline?: () => void;
  postRequirementHref?: string;
}

export default function EmptyState({ onReset, onIncludeOnline, postRequirementHref = "/post-tuition-request" }: EmptyStateProps) {
  return (
    <div className={styles.wrap} role="status">
      <div className={styles.icon} aria-hidden="true">
        <svg width={36} height={36} viewBox="0 0 20 20" fill="#0329B2" opacity={0.4}>
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h3 className={styles.title}>We couldn&apos;t find the right tutor yet.</h3>
      <p className={styles.desc}>
        Post your requirement with your preferred budget and let suitable tutors send offers to you.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "8px" }}>
        <Link
          href={postRequirementHref}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #0329b2, #016ef8)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          + Post Your Requirement
        </Link>
        {onIncludeOnline && (
          <button
            type="button"
            onClick={onIncludeOnline}
            className={styles.btn}
            style={{ background: "#ffffff", color: "#0329b2", border: "1.5px solid #cbd5e1", fontWeight: 700 }}
          >
            Include online tutors
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className={styles.btn}
          style={{ background: "transparent", color: "#475569", boxShadow: "none", fontWeight: 600 }}
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}
