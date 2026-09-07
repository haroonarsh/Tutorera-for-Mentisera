import type { Metadata } from "next";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";
const path = "/research/tutoring-index";

export const metadata: Metadata = {
  title: "TUTORERA Tutoring Index | Demand, Rates & Learning Trends",
  description: "An anonymized six-month view of tutoring demand, offer rates, bookings, response times, cities, and learning modes across TUTORERA.",
  alternates: { canonical: path },
};

type IndexData = {
  publishedAt: string;
  period: { from: string; to: string };
  summary: { totalRequests: number; totalBookings: number; totalTutors: number; verifiedTutors: number; subjectsCovered: number };
  subjects: Array<{ subject: string; totalRequests: number; avgBudget: number; minBudget: number; maxBudget: number; avgOfferRate: number; avgFinalRate: number; avgResponseHours: number; topCities: Array<{ city: string; count: number }>; teachingModeSplit: { online: number; inPerson: number; both: number } }>;
  trends: Array<{ month: string; requests: number; bookings: number; avgRate: number }>;
};

async function getIndex(): Promise<IndexData | null> {
  try {
    const response = await fetch(`${API_URL}/tutoring-index`, { next: { revalidate: 900 } });
    if (!response.ok) return null;
    return (await response.json()).index || null;
  } catch { return null; }
}

const number = (value: number) => value.toLocaleString("en-PK");
const money = (value: number) => value ? `PKR ${number(value)}` : "Insufficient sample";

export default async function TutoringIndexPage() {
  const index = await getIndex();
  const schema = { "@context": "https://schema.org", "@type": "Dataset", name: "TUTORERA Tutoring Index", description: "Anonymized aggregate tutoring demand and rate trends from the TUTORERA marketplace.", url: `https://tutorera.ac.pk${path}`, creator: { "@id": "https://tutorera.ac.pk/#organization" }, temporalCoverage: index ? `${index.period.from}/${index.period.to}` : "2026", isAccessibleForFree: true };

  return <main style={{ color: "#021550", background: "#f8faff", minHeight: "70vh" }}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><header style={{ background: "linear-gradient(135deg,#021550,#0329B2 70%,#016EF8)", color: "white", padding: "4.5rem 1.25rem", textAlign: "center" }}><p style={{ color: "#08BFFC", fontWeight: 800, letterSpacing: ".14em", fontSize: ".75rem" }}>ORIGINAL MARKETPLACE RESEARCH</p><h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", margin: "0 0 1rem", fontWeight: 900 }}>TUTORERA Tutoring Index</h1><p style={{ maxWidth: 720, margin: "0 auto", color: "#dbeafe", lineHeight: 1.7 }}>A transparent, anonymized view of what students request, what tutors offer, and how learning demand moves across online and in-person tutoring.</p></header><div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>{!index ? <section style={styles.empty}><h2 style={styles.h2}>The index is updating</h2><p>We do not publish a number until there is enough anonymized marketplace activity to make it meaningful. Explore current public tutor rates in the meantime.</p><Link href="/research/pakistan-tutoring-rates" style={styles.link}>View Pakistan rate snapshot</Link></section> : <><section style={styles.statGrid}>{[[index.summary.totalRequests,"requests"],[index.summary.totalBookings,"bookings"],[index.summary.verifiedTutors,"verified tutors"],[index.summary.subjectsCovered,"subjects"]].map(([value,label]) => <div key={String(label)} style={styles.stat}><strong>{number(Number(value))}</strong><span>{label}</span></div>)}</section><p style={styles.note}>Period: {new Date(index.period.from).toLocaleDateString("en-PK",{month:"short",year:"numeric"})} to {new Date(index.period.to).toLocaleDateString("en-PK",{month:"short",year:"numeric"})}. Values are aggregated and rounded; no student identity, address, contact detail, or individual transaction is published.</p><section style={styles.card}><h2 style={styles.h2}>Demand and rates by subject</h2><div style={{ overflowX: "auto" }}><table style={styles.table}><thead><tr>{["Subject","Requests","Typical budget","Offer rate","Final rate","Response","Top cities","Modes"].map((heading) => <th key={heading} style={styles.th}>{heading}</th>)}</tr></thead><tbody>{index.subjects.map((row) => <tr key={row.subject}><td style={styles.td}><strong>{row.subject}</strong></td><td style={styles.td}>{number(row.totalRequests)}</td><td style={styles.td}>{money(row.avgBudget)}</td><td style={styles.td}>{money(row.avgOfferRate)}</td><td style={styles.td}>{money(row.avgFinalRate)}</td><td style={styles.td}>{row.avgResponseHours ? `${row.avgResponseHours}h` : "—"}</td><td style={styles.td}>{row.topCities.slice(0,2).map((city) => `${city.city} (${city.count})`).join(", ") || "—"}</td><td style={styles.td}>{row.teachingModeSplit.online}% online · {row.teachingModeSplit.inPerson}% home · {row.teachingModeSplit.both}% both</td></tr>)}</tbody></table></div></section><section style={styles.card}><h2 style={styles.h2}>Monthly movement</h2><div style={styles.trendGrid}>{index.trends.map((trend) => <div key={trend.month} style={styles.trend}><strong>{trend.month}</strong><span>{number(trend.requests)} requests · {number(trend.bookings)} bookings</span><small>{money(trend.avgRate)} average final rate</small></div>)}</div></section><section style={styles.method}><h2 style={styles.h2}>Methodology</h2><p>We aggregate non-draft requests, eligible marketplace activity, tutor offers, and bookings from the latest six months. We report categories only as aggregates and use rounded values to reduce re-identification risk. Advertised budgets, offer rates, and final rates are different measures: a student proposal is not a quote, and neither guarantees tutor availability. This index is descriptive research, not financial or educational advice.</p></section></>}</div></main>;
}

const styles: Record<string, React.CSSProperties> = { empty: { background: "white", border: "1px solid #dbe5f3", borderRadius: "1rem", padding: "2rem", textAlign: "center", maxWidth: 680, margin: "0 auto" }, h2: { margin: "0 0 .8rem", fontSize: "1.35rem", fontWeight: 850 }, link: { display: "inline-flex", background: "#0329B2", color: "white", padding: ".7rem 1rem", borderRadius: ".6rem", textDecoration: "none", fontWeight: 800 }, statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: ".8rem", marginBottom: "1rem" }, stat: { background: "white", border: "1px solid #dbe5f3", borderRadius: ".9rem", padding: "1.1rem", display: "grid", gap: ".25rem" }, note: { color: "#64748b", fontSize: ".8rem", lineHeight: 1.6, marginBottom: "1.5rem" }, card: { background: "white", border: "1px solid #dbe5f3", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.25rem", boxShadow: "0 7px 22px rgba(2,21,80,.04)" }, table: { width: "100%", borderCollapse: "collapse", minWidth: 900 }, th: { textAlign: "left", padding: ".75rem", background: "#f1f5ff", fontSize: ".72rem", color: "#475569", whiteSpace: "nowrap" }, td: { padding: ".75rem", borderBottom: "1px solid #eef2f7", fontSize: ".78rem", verticalAlign: "top" }, trendGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: ".7rem" }, trend: { background: "#f8faff", border: "1px solid #e2e8f0", borderRadius: ".7rem", padding: ".8rem", display: "grid", gap: ".35rem", fontSize: ".78rem" }, method: { color: "#475569", lineHeight: 1.75, fontSize: ".88rem", padding: "1rem 0" } };
