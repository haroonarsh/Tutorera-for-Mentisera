"use client";

import { useCallback, useRef, useState } from "react";
import api from "@/lib/axios";
import type { FiltersState, PaginationMeta, TutorProfile } from "@/types/tutor";
import { CITIES, INITIAL_FILTERS, SORT_OPTIONS } from "@/types/tutor";
import TutorCard from "./TutorCard";
import SkeletonCard from "./SkeletonCard";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import { FilterSidebar, MobileFilterSidebar } from "./FilterSidebar";
import styles from "@/app/tutors/page.module.css";

interface Props { initialTutors: TutorProfile[]; initialPagination: PaginationMeta; initialFilters?: Partial<FiltersState>; }

function query(filters: FiltersState, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "12" });
  Object.entries(filters).forEach(([key, value]) => value && key !== "sortBy" && params.set(key, value));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  return params.toString();
}

export default function TutorsExplorer({ initialTutors, initialPagination, initialFilters = {} }: Props) {
  const [tutors, setTutors] = useState(initialTutors);
  const [pagination, setPagination] = useState(initialPagination);
  const [filters, setFilters] = useState<FiltersState>({ ...INITIAL_FILTERS, ...initialFilters });
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => !["search", "sortBy"].includes(key) && value).length;

  const load = useCallback(async (page: number, next: FiltersState) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutors?${query(next, page)}`);
      const list = data.tutors ?? [];
      setTutors(list);
      setPagination({ total: data.total ?? list.length, page: data.page ?? page, pages: data.pages ?? 1, limit: 12 });
    } finally { setLoading(false); }
  }, []);

  function change(key: keyof FiltersState, value: string) {
    const next = { ...filters, [key]: value }; setFilters(next);
    if (["search", "minPrice", "maxPrice"].includes(key)) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => load(1, next), 450);
    } else load(1, next);
  }
  function reset() { setFilters(INITIAL_FILTERS); load(1, INITIAL_FILTERS); }
  const sidebarProps = { filters, onFilterChange: change, onReset: reset, activeFilterCount };

  return <div className={styles.page}>
    <div className={styles.hero}><div className={styles.heroInner}>
      <h1 className={styles.heroTitle}>Find Verified Tutors in Pakistan</h1>
      <p className={styles.heroSubtitle}>{pagination.total ? `${pagination.total} verified tutors available online and in person` : "Browse verified tutors across Pakistan"}</p>
      <div className={styles.searchBar} role="search">
        <div className={styles.searchField}><input type="search" placeholder="Search by subject or tutor name..." aria-label="Search tutors" value={filters.search} onChange={(event) => change("search", event.target.value)} className={styles.searchInput} /></div>
        <div className={styles.cityField}><select aria-label="Filter tutors by city" value={filters.city} onChange={(event) => change("city", event.target.value)} className={styles.citySelect}><option value="">All Cities</option>{CITIES.map((city) => <option key={city}>{city}</option>)}</select></div>
        <button onClick={() => load(1, filters)} className={styles.searchBtn}>Search</button>
      </div>
    </div></div>
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Filter tutors"><FilterSidebar {...sidebarProps} /></aside>
      <MobileFilterSidebar {...sidebarProps} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className={styles.main}>
        <div className={styles.resultsHeader}>
          <p className={styles.resultsCount} aria-live="polite"><span className={styles.resultsCountAccent}>{pagination.total}</span> tutors found</p>
          <div className={styles.headerRight}>
            <button className={styles.mobileFilterBtn} onClick={() => setMobileOpen(true)}>Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</button>
            <div className={styles.sortControl}><select aria-label="Sort tutors" value={filters.sortBy} onChange={(event) => change("sortBy", event.target.value)} className={styles.sortSelect}>{SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          </div>
        </div>
        {loading ? <div className={styles.grid} aria-busy="true">{Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}</div> : tutors.length ? <div className={styles.grid}>{tutors.map((tutor) => <TutorCard key={tutor._id} tutor={tutor} />)}</div> : <EmptyState onReset={reset} />}
        {!loading && pagination.pages > 1 && <div className={styles.paginationWrap}><Pagination meta={pagination} onPageChange={(page) => { load(page, filters); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></div>}
      </main>
    </div>
  </div>;
}
