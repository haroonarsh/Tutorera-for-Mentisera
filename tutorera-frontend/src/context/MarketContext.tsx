"use client";

// Central "current market" context for pages under the /[countryCode]
// country routes (src/app/(countries)/[countryCode]/**). A visitor entering
// /pk or /uk should have country/currency/locale/market-status available to
// every descendant client component without each one re-resolving the
// country itself - this is that single source of truth.
//
// The provider is seeded server-side (see (countries)/[countryCode]/layout.tsx)
// via lib/market.ts's toMarketInfo(), built from the same resolveCountry()
// call server components already use, so there's no extra client-side fetch
// and no risk of the client and server disagreeing about which market is
// active. (toMarketInfo/MarketInfo live in lib/market.ts, not here, because
// this module's "use client" directive means nothing in it can be called
// from a server component.)
//
// This does NOT yet change how the three pre-existing country-routing
// schemes work (see the audit note in (countries)/[countryCode]/layout.tsx)
// - it's additive plumbing for the (countries) tree only, the smallest safe
// slice of the larger market-context requirement.

import { createContext, useContext, ReactNode } from "react";
import type { MarketInfo } from "@/lib/market";

export type { MarketInfo } from "@/lib/market";

const MarketContext = createContext<MarketInfo | null>(null);

export function MarketProvider({ market, children }: { market: MarketInfo; children: ReactNode }) {
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}

/** Throws outside a MarketProvider - use useOptionalMarket() for components
 * that may render both inside and outside a country route. */
export function useMarket(): MarketInfo {
  const market = useContext(MarketContext);
  if (!market) {
    throw new Error("useMarket() called outside a MarketProvider - this component must render under a /[countryCode] route.");
  }
  return market;
}

export function useOptionalMarket(): MarketInfo | null {
  return useContext(MarketContext);
}
