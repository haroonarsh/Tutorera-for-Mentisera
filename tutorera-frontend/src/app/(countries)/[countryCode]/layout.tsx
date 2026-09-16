// Seeds MarketContext for every page under /[countryCode] (e.g. /pk, /uk,
// /ae) from the same resolveCountry() lookup the pages themselves already
// use for metadata/content, so client components anywhere in this tree can
// read the active market via useMarket() instead of re-deriving it.
//
// NOTE (routing audit): this is one of three country-routing schemes that
// currently coexist in this codebase - (countries)/[countryCode], a
// hardcoded /pk/home-tutors/[city] folder, and tuition-requests/[country].
// Unifying those into a single canonical scheme is a separate, larger
// follow-up; this layout only wires market context into this one tree
// without touching the others, per the "smallest safe change" approach.
import { notFound } from "next/navigation";
import { resolveCountry } from "@/lib/geo-server";
import { toMarketInfo } from "@/lib/market";
import { MarketProvider } from "@/context/MarketContext";

export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ countryCode: string }>;
}) {
  const { countryCode } = await params;
  const country = await resolveCountry(countryCode);
  if (!country) notFound();

  const market = toMarketInfo(country, countryCode);
  return <MarketProvider market={market}>{children}</MarketProvider>;
}
