import type { MarketConfig } from "@/lib/markets";

/** Format display-only market amounts using the market locale/currency.
 * Transaction records must continue to use the currency stored on the request,
 * offer, booking or payment rather than the visitor's currently selected market.
 */
export function formatMarketMoney(amount: number, market: MarketConfig): string {
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function marketCurrencyLabel(market: MarketConfig): string {
  return `${market.currency} (${market.currencySymbol})`;
}
