"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

export interface RateRangeHintProps {
  subject?: string;
  city?: string;
  currency: string;
}

interface RateRange {
  min: number;
  median: number;
  max: number;
  sampleSize: number;
}

// Same reasoning as elsewhere in the codebase (research/pakistan-tutoring-rates,
// SeoTutorDirectory): a range computed from fewer than 2 real listings is noise,
// not a benchmark - fall back to the platform's own existing typical-budget
// defaults (already used as RequestWizard's starting budget value per currency)
// rather than inventing a new number.
const FALLBACK_RATE: Record<string, number> = { PKR: 2000, AED: 80, GBP: 25, SAR: 30, USD: 30, INR: 500 };

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export default function RateRangeHint({ subject, city, currency }: RateRangeHintProps) {
  const [range, setRange] = useState<RateRange | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subject) {
      setRange(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ subject, limit: "100" });
    if (city) params.set("city", city);
    api
      .get(`/tutors?${params}`)
      .then(({ data }) => {
        if (cancelled) return;
        const rates: number[] = (data?.tutors || [])
          .map((t: { hourlyRate?: number }) => t.hourlyRate)
          .filter((rate: number | undefined): rate is number => Boolean(rate && rate > 0));
        if (rates.length >= 2) {
          setRange({ min: Math.min(...rates), median: median(rates), max: Math.max(...rates), sampleSize: rates.length });
        } else {
          setRange(null);
        }
      })
      .catch(() => setRange(null))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [subject, city]);

  if (!subject || loading) return null;

  const fallback = FALLBACK_RATE[currency] ?? FALLBACK_RATE.PKR;

  return (
    <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>
      {range ? (
        <>
          Typical rate for {subject}{city ? ` in ${city}` : ""}:{" "}
          <strong style={{ color: "#0329b2" }}>
            {currency} {range.min.toLocaleString()}–{range.max.toLocaleString()}
          </strong>{" "}
          (median {currency} {range.median.toLocaleString()}/hr, based on {range.sampleSize} listed tutors).
        </>
      ) : (
        <>
          Not enough listed tutors yet for a {subject} rate benchmark{city ? ` in ${city}` : ""}. A typical
          starting budget is around <strong style={{ color: "#0329b2" }}>{currency} {fallback.toLocaleString()}/hr</strong>.
        </>
      )}
    </p>
  );
}
