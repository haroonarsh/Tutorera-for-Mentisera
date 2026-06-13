// app/tutors/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";

import {
  TutorProfile,
  PaginationMeta,
  FiltersState,
  CITIES,
  SORT_OPTIONS,
  INITIAL_FILTERS,
} from "@/types/tutor";

import TutorCard from "@/components/Tutors/TutorCard";
import SkeletonCard from "@/components/Tutors/SkeletonCard";
import EmptyState from "@/components/Tutors/EmptyState";
import Pagination from "@/components/Tutors/Pagination";
import { FilterSidebar, MobileFilterSidebar } from "@/components/Tutors/FilterSidebar";
import { useTutorGuard } from "@/hooks/useTutorGuard";

import styles from "./page.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countActiveFilters(filters: FiltersState): number {
  const skip: (keyof FiltersState)[] = ["search", "sortBy"];
  return Object.entries(filters).filter(
    ([key, val]) => !skip.includes(key as keyof FiltersState) && val !== ""
  ).length;
}

function buildParams(filters: FiltersState, page: number): string {
  const params: Record<string, string> = { page: String(page), limit: "12" };
  if (filters.search)       params.search       = filters.search;
  if (filters.city)         params.city         = filters.city;
  if (filters.level)        params.level        = filters.level;
  if (filters.teachingMode) params.teachingMode = filters.teachingMode;
  if (filters.minPrice)     params.minPrice     = filters.minPrice;
  if (filters.maxPrice)     params.maxPrice     = filters.maxPrice;
  if (filters.minRating)    params.minRating    = filters.minRating;
  if (filters.sortBy)       params.sortBy       = filters.sortBy;
  return new URLSearchParams(params).toString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TutorsPage() {
  const [tutors, setTutors]         = useState<TutorProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState<FiltersState>(INITIAL_FILTERS);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0, page: 1, pages: 1, limit: 12,
  });

  const debounceTimer               = useRef<NodeJS.Timeout | null>(null);
  const activeFilterCount           = countActiveFilters(filters);
  const DEBOUNCED: (keyof FiltersState)[] = ["search", "minPrice", "maxPrice"];
  const tutorStatus = useTutorGuard();

  // ← ADD: block pending/rejected tutors + show spinner while checking
  if (loading || tutorStatus === "loading") return null;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTutors = useCallback(async (page: number, f: FiltersState) => {
    setLoading(true);
    try {
      const res  = await axiosInstance.get(`/tutors?${buildParams(f, page)}`);
      const d    = res.data;
      const list = d.tutors ?? d.data ?? d ?? [];
      const meta = d.pagination ?? d.meta ?? {};
      setTutors(list);
      setPagination({
        total: meta.total ?? list.length,
        page:  meta.page  ?? page,
        pages: meta.pages ?? 1,
        limit: meta.limit ?? 12,
      });
    } catch (err) {
      console.error("Failed to fetch tutors:", err);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTutors(1, INITIAL_FILTERS); }, [fetchTutors]);

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleFilterChange(key: keyof FiltersState, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (DEBOUNCED.includes(key)) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => fetchTutors(1, next), 500);
    } else {
      fetchTutors(1, next);
    }
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
    fetchTutors(1, INITIAL_FILTERS);
  }

  function handlePageChange(page: number) {
    fetchTutors(page, filters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeChip(keys: (keyof FiltersState)[]) {
    const next = { ...filters };
    keys.forEach((k) => { next[k] = ""; });
    setFilters(next);
    fetchTutors(1, next);
  }

  // ── Shared sidebar props ───────────────────────────────────────────────────

  const sidebarProps = { filters, onFilterChange: handleFilterChange, onReset: handleReset, activeFilterCount };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Find Your Perfect Tutor</h1>
          <p className={styles.heroSubtitle}>
            {pagination.total > 0
              ? `${pagination.total} verified tutors available across Pakistan`
              : "Browse verified tutors across Pakistan"}
          </p>

          <div className={styles.searchBar} role="search">
            <div className={styles.searchField}>
              <svg width={18} height={18} viewBox="0 0 20 20" fill="#9ca3af" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="search"
                placeholder="Search by subject or tutor name..."
                aria-label="Search tutors by subject or name"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.cityField}>
              <svg width={16} height={16} viewBox="0 0 20 20" fill="#9ca3af" aria-hidden="true">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <select
                aria-label="Filter by city"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className={styles.citySelect}
              >
                <option value="">All Cities</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <button onClick={() => fetchTutors(1, filters)} className={styles.searchBtn} aria-label="Search">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className={styles.layout}>

        <aside className={styles.sidebar} aria-label="Filter tutors">
          <FilterSidebar {...sidebarProps} />
        </aside>

        <MobileFilterSidebar {...sidebarProps} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <main className={styles.main}>

          {/* Results header */}
          <div className={styles.resultsHeader}>
            <p className={styles.resultsCount} aria-live="polite">
              {loading ? "Loading..." : (
                <>
                  <span className={styles.resultsCountAccent}>{pagination.total}</span>
                  {" tutors found"}
                  {filters.search && (
                    <span className={styles.resultsCountSub}> for &ldquo;{filters.search}&rdquo;</span>
                  )}
                </>
              )}
            </p>

            <div className={styles.headerRight}>
              <button
                onClick={() => setMobileOpen(true)}
                className={`${styles.mobileFilterBtn} ${activeFilterCount > 0 ? styles.mobileFilterBtnActive : ""}`}
                aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
              >
                <svg width={14} height={14} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.553.894l-4 2A1 1 0 016 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>

              <div className={styles.sortControl}>
                <svg width={14} height={14} viewBox="0 0 20 20" fill="#9ca3af" aria-hidden="true">
                  <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                </svg>
                <select
                  aria-label="Sort tutors by"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className={styles.sortSelect}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filter chips */}
          {activeFilterCount > 0 && (
            <div className={styles.chips} role="list" aria-label="Active filters">
              {filters.city && (
                <span className={styles.chip} role="listitem">
                  City: {filters.city}
                  <button onClick={() => removeChip(["city"])} className={styles.chipRemove} aria-label="Remove city filter">×</button>
                </span>
              )}
              {filters.level && (
                <span className={styles.chip} role="listitem">
                  Level: {filters.level}
                  <button onClick={() => removeChip(["level"])} className={styles.chipRemove} aria-label="Remove level filter">×</button>
                </span>
              )}
              {filters.teachingMode && (
                <span className={styles.chip} role="listitem">
                  Mode: {filters.teachingMode}
                  <button onClick={() => removeChip(["teachingMode"])} className={styles.chipRemove} aria-label="Remove mode filter">×</button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className={styles.chip} role="listitem">
                  PKR {filters.minPrice || "0"} – {filters.maxPrice || "∞"}
                  <button onClick={() => removeChip(["minPrice", "maxPrice"])} className={styles.chipRemove} aria-label="Remove price filter">×</button>
                </span>
              )}
              {filters.minRating && (
                <span className={styles.chip} role="listitem">
                  {filters.minRating}+ Stars
                  <button onClick={() => removeChip(["minRating"])} className={styles.chipRemove} aria-label="Remove rating filter">×</button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className={styles.grid} aria-busy="true" aria-label="Loading tutors">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : tutors.length === 0 ? (
            <EmptyState onReset={handleReset} />
          ) : (
            <div className={styles.grid}>
              {tutors.map((t) => <TutorCard key={t._id} tutor={t} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className={styles.paginationWrap}>
              <Pagination meta={pagination} onPageChange={handlePageChange} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}