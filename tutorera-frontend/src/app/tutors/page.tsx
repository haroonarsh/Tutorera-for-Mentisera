import type { Metadata } from "next";
import TutorsExplorer from "@/components/Tutors/TutorsExplorer";
import { fetchTutors } from "@/lib/tutor-directory";
import type { FiltersState } from "@/types/tutor";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const value = (input: string | string[] | undefined) => typeof input === "string" ? input : "";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, parseInt(value(params.page)) || 1);
  // Page 1 (and any filter-only query, e.g. ?city=Lahore) canonicalizes to
  // the clean /tutors URL - filter combinations are near-duplicates of each
  // other. Page 2+ is genuinely different content (different tutors), so it
  // self-canonicalizes instead of pointing back to page 1, which previously
  // told crawlers page 2+ wasn't worth indexing separately even once it
  // became reachable via a real link (see Pagination.tsx).
  return {
    title: page > 1 ? `Find Verified Tutors Online & In-Person - Page ${page}` : "Find Verified Tutors Online & In-Person",
    description: "Search verified tutors worldwide and locally by subject, curriculum, country, teaching mode, rating, availability, and transparent hourly rates.",
    alternates: { canonical: page > 1 ? `/tutors?page=${page}` : "/tutors" },
  };
}

export default async function TutorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(value(params.page)) || 1);
  const initialFilters: Partial<FiltersState> = {
    search: value(params.search),
    country: value(params.country || params.countryCode),
    city: value(params.city),
    level: value(params.level),
    teachingMode: value(params.teachingMode),
    minPrice: value(params.minPrice),
    maxPrice: value(params.maxPrice),
    minRating: value(params.minRating),
    sortBy: value(params.sortBy) || "rating",
  } as Partial<FiltersState>;

  const subject = value(params.subject);
  if (subject && !initialFilters.search) initialFilters.search = subject;

  const result = await fetchTutors({
    search: initialFilters.search,
    city: initialFilters.city,
    countryCode: value(params.countryCode),
    country: value(params.country),
    level: initialFilters.level,
    subject,
    teachingMode: initialFilters.teachingMode,
    minPrice: initialFilters.minPrice,
    maxPrice: initialFilters.maxPrice,
    minRating: initialFilters.minRating,
  }, 12, page);

  return (
    <TutorsExplorer
      initialTutors={result.tutors}
      initialPagination={{ total: result.total, page: result.page, pages: result.pages, limit: 12 }}
      initialFilters={initialFilters}
    />
  );
}
