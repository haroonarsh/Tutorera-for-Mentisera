// components/tutors/Pagination.tsx
import Link from "next/link";
import { PaginationMeta } from "@/types/tutor";
import styles from "./Pagination.module.css";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Builds a real, crawlable URL for a given page (current filters + that
   * page number). Pagination was previously pure client state with no
   * unique URL per page - page 2+ was invisible to any crawler that doesn't
   * execute JS. */
  hrefBuilder: (page: number) => string;
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

export default function Pagination({ meta, onPageChange, hrefBuilder }: PaginationProps) {
  const totalPagesCount = meta.pages || meta.totalPages || 1;
  const pages = buildPageList(meta.page, totalPagesCount);

  // Real users get instant client-side pagination (preventDefault + the
  // existing fetch-in-place); a crawler, or anyone with JS off / opening in
  // a new tab, still gets a working link to a real, unique, indexable URL.
  function handleClick(page: number) {
    return (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (page < 1 || page > totalPagesCount) return;
      onPageChange(page);
    };
  }

  return (
    <nav aria-label="Tutor results pagination">
      <div className={styles.wrap}>
        <Link
          className={styles.navBtn}
          href={hrefBuilder(meta.page - 1)}
          onClick={handleClick(meta.page - 1)}
          aria-disabled={meta.page === 1}
          tabIndex={meta.page === 1 ? -1 : undefined}
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
        </Link>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className={styles.dots} aria-hidden="true">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefBuilder(p as number)}
              onClick={handleClick(p as number)}
              aria-label={`Page ${p}`}
              aria-current={meta.page === p ? "page" : undefined}
              className={`${styles.pageBtn} ${
                meta.page === p ? styles.pageBtnActive : ""
              }`}
            >
              {p}
            </Link>
          )
        )}

        <Link
          className={styles.navBtn}
          href={hrefBuilder(meta.page + 1)}
          onClick={handleClick(meta.page + 1)}
          aria-disabled={meta.page === meta.pages}
          tabIndex={meta.page === meta.pages ? -1 : undefined}
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
        </Link>
      </div>

      <p className={styles.meta} aria-live="polite">
        Showing {(meta.page - 1) * meta.limit + 1}–
        {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} tutors
      </p>
    </nav>
  );
}
