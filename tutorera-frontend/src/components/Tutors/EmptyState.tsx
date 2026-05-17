// components/tutors/EmptyState.tsx
import styles from "./Emptystate.module.css";

interface EmptyStateProps {
  onReset: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className={styles.wrap} role="status">
      <div className={styles.icon} aria-hidden="true">
        <svg width={36} height={36} viewBox="0 0 20 20" fill="#2563eb" opacity={0.4}>
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h3 className={styles.title}>No tutors found</h3>
      <p className={styles.desc}>
        Try adjusting your filters or search terms to find more tutors.
      </p>
      <button onClick={onReset} className={styles.btn}>
        Clear All Filters
      </button>
    </div>
  );
}