import type { Metadata } from "next";
import Link from "next/link";
import styles from "./TutoringIndex.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";
const path = "/research/tutoring-index";

export const metadata: Metadata = {
  title: "Global Tutoring Index | Country-Specific Tutoring Rates",
  description: "An anonymized, currency-safe view of tutoring demand, offers, bookings, and response times by country.",
  alternates: { canonical: path },
};

type IndexData = {
  market: { country: string; currency: string };
  methodologyVersion: string;
  minimumSampleSize: number;
  period: { from: string; to: string };
  summary: { totalRequests: number; totalBookings: number; totalTutors: number; verifiedTutors: number; subjectsCovered: number };
  subjects: Array<{ subject: string; totalRequests: number; avgBudget: number; avgOfferRate: number; avgFinalRate: number; avgResponseHours: number; topCities: Array<{ city: string; count: number }>; teachingModeSplit: { online: number; inPerson: number; both: number } }>;
  trends: Array<{ month: string; requests: number; bookings: number; avgRate: number }>;
};

const markets = [{ country: "PK", currency: "PKR", label: "Pakistan" }, { country: "AE", currency: "AED", label: "United Arab Emirates" }, { country: "GB", currency: "GBP", label: "United Kingdom" }];

async function getIndex(country: string, currency: string, period: string): Promise<IndexData | null> {
  try {
    const response = await fetch(`${API_URL}/tutoring-index?country=${country}&currency=${currency}&period=${period}`, { next: { revalidate: 900 } });
    if (!response.ok) return null;
    return (await response.json()).index || null;
  } catch { return null; }
}

const number = (value: number) => value.toLocaleString("en");
const money = (value: number, currency: string) => value ? new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value) : "Insufficient sample";

export default async function TutoringIndexPage({ searchParams }: { searchParams: Promise<{ country?: string; currency?: string; period?: string }> }) {
  const query = await searchParams;
  const selected = markets.find((market) => market.country === String(query.country || "PK").toUpperCase()) || markets[0];
  const period = ["3m", "6m", "12m"].includes(query.period || "") ? String(query.period) : "6m";
  const index = await getIndex(selected.country, selected.currency, period);
  const schema = { "@context": "https://schema.org", "@type": "Dataset", name: `TUTORERA Tutoring Index — ${selected.label}`, description: `Anonymized ${selected.currency} tutoring marketplace aggregates for ${selected.label}.`, url: `https://tutorera.ac.pk${path}?country=${selected.country}`, creator: { "@id": "https://tutorera.ac.pk/#organization" }, temporalCoverage: index ? `${index.period.from}/${index.period.to}` : undefined, isAccessibleForFree: true };

  return <main className={styles.main}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className={styles.hero}><p>ORIGINAL MARKETPLACE RESEARCH</p><h1>Global Tutoring Index</h1><span>Country-specific benchmarks without mixing currencies or exposing individual transactions.</span></header>
    <div className={styles.content}>
      <nav className={styles.filters} aria-label="Tutoring Index market and period">
        {markets.map((market) => <Link key={market.country} aria-current={selected.country === market.country ? "page" : undefined} href={`${path}?country=${market.country}&currency=${market.currency}&period=${period}`}>{market.label} · {market.currency}</Link>)}
        {["3m", "6m", "12m"].map((value) => <Link key={value} aria-current={period === value ? "page" : undefined} href={`${path}?country=${selected.country}&currency=${selected.currency}&period=${value}`}>{value}</Link>)}
      </nav>
      {!index || !index.subjects.length ? <section className={styles.empty}><h2>Not enough verified observations yet</h2><p>We publish a subject only after at least {index?.minimumSampleSize || 5} qualifying requests in this market and currency.</p>{selected.country === "PK" && <Link href="/research/pakistan-tutoring-rates">View the labelled Pakistan research snapshot</Link>}</section> : <>
        <section className={styles.stats} aria-label={`${selected.label} index summary`}>{[[index.summary.totalRequests,"requests"],[index.summary.totalBookings,"bookings"],[index.summary.verifiedTutors,"verified tutors"],[index.summary.subjectsCovered,"published subjects"]].map(([value,label]) => <div key={String(label)}><strong>{number(Number(value))}</strong><span>{label}</span></div>)}</section>
        <p className={styles.note}>{selected.label} · {selected.currency} · {new Date(index.period.from).toLocaleDateString("en",{month:"short",year:"numeric"})}–{new Date(index.period.to).toLocaleDateString("en",{month:"short",year:"numeric"})}. Methodology v{index.methodologyVersion}; minimum sample {index.minimumSampleSize}.</p>
        <section className={styles.card}><h2>Demand and rates by subject</h2><div className={styles.tableWrap}><table><thead><tr>{["Subject","Requests","Typical budget","Offer rate","Final rate","Response","Top cities","Modes"].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{index.subjects.map((row) => <tr key={row.subject}><th scope="row">{row.subject}</th><td>{number(row.totalRequests)}</td><td>{money(row.avgBudget, selected.currency)}</td><td>{money(row.avgOfferRate, selected.currency)}</td><td>{money(row.avgFinalRate, selected.currency)}</td><td>{row.avgResponseHours ? `${row.avgResponseHours}h` : "—"}</td><td>{row.topCities.slice(0,2).map((city) => `${city.city} (${city.count})`).join(", ") || "—"}</td><td>{row.teachingModeSplit.online}% online · {row.teachingModeSplit.inPerson}% home · {row.teachingModeSplit.both}% both</td></tr>)}</tbody></table></div></section>
        <section className={styles.card}><h2>Monthly movement</h2><div className={styles.trends}>{index.trends.map((trend) => <article key={trend.month}><strong>{trend.month}</strong><span>{number(trend.requests)} requests · {number(trend.bookings)} bookings</span><small>{money(trend.avgRate, selected.currency)} average final rate</small></article>)}</div></section>
      </>}
      <section className={styles.method}><h2>Methodology and privacy</h2><p>Each view is restricted to one country and its authoritative transaction currency. Drafts are excluded, values are rounded, and subjects below the publication threshold are suppressed. Budgets, offers, and agreed rates remain distinct measures and are descriptive—not financial advice.</p></section>
    </div>
  </main>;
}
