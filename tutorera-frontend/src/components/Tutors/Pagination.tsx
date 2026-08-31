// components/tutors/Pagination.tsx
import { PaginationMeta } from "@/types/tutor";
import styles from "./Pagination.module.css";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const half = 2;
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  const pages: (number | "...")[] = [];
  if (start > 1) pages.push(1, "...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total) pages.push("...", total);
  return pages;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  const pages = buildPageList(meta.page, meta.pages);

  return (
    <nav aria-label="Tutor results pagination">
      <div className={styles.wrap}>
        <button
          className={styles.navBtn}
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page === 1}
          aria-label="Go to previous page"
        >
          <svg width={14} height={14} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Prev
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className={styles.dots} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-label={`Page ${p}`}
              aria-current={meta.page === p ? "page" : undefined}
              className={`${styles.pageBtn} ${
                meta.page === p ? styles.pageBtnActive : ""
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          className={styles.navBtn}
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page === meta.pages}
          aria-label="Go to next page"
        >
          Next
          <svg width={14} height={14} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <p className={styles.meta} aria-live="polite">
        Showing {(meta.page - 1) * meta.limit + 1}–
        {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} tutors
      </p>
    </nav>
  );
}
