// src/services/tutorSlug.service.ts
//
// Generates the SEO-friendly tutor profile slug and URL. Replaces the old
// frontend-only pattern that embedded the Mongo ObjectId directly in the
// visible URL (e.g. "6ab3de03c7eb556afb57ff43-samah-gamal-mathematics-tutor-egypt")
// with a clean, human-readable one that is persisted on the profile and
// looked up directly - no ObjectId in the URL at all.
//
// Canonical shape: /tutors/{country}/{name}-{subject}-tutor-{nationality}
// e.g.            /tutors/egypt/samah-gamal-mathematics-tutor-egyptian

import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import { COUNTRIES } from "../config/countries";

// Unlike config/countries.ts's getCountryByCode(), which always falls back
// to Pakistan for an unrecognized code (fine for pricing/market defaults,
// wrong here), this returns undefined for a country outside the supported
// master list so callers can fall back to the profile's own free-text
// countryName instead of silently mislabeling someone's nationality.
function findCountryStrict(code?: string) {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === upper);
}

export function slugify(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Explicit map for the markets this platform actually serves/targets -
// guessing nationality adjectives from a country name via suffix rules
// (e.g. stripping "-a" for "-ian") produces wrong results often enough
// (Chile -> "Chilan"? Qatar -> "Qatarian"?) that an explicit list reads
// better in a URL than a clever-but-wrong heuristic. Anything not listed
// falls back to the bare, slugified country name, which still reads fine
// in a URL (e.g. "...-tutor-singapore" rather than guessing "Singaporean").
const NATIONALITY_BY_COUNTRY: Record<string, string> = {
  Pakistan: "Pakistani",
  Egypt: "Egyptian",
  "United Arab Emirates": "Emirati",
  UAE: "Emirati",
  "United Kingdom": "British",
  "United States": "American",
  India: "Indian",
  Canada: "Canadian",
  Australia: "Australian",
  "Saudi Arabia": "Saudi",
  Qatar: "Qatari",
  Malaysia: "Malaysian",
  Bangladesh: "Bangladeshi",
};

function countryNameToNationality(countryName: string): string {
  const name = countryName.trim();
  if (!name) return "";
  return NATIONALITY_BY_COUNTRY[name] || name;
}

export function countrySlugFromCode(countryCode?: string, fallbackName?: string): string {
  const country = findCountryStrict(countryCode);
  return slugify(country?.name || fallbackName || "pakistan");
}

/** The base, pre-collision-check slug text: "{name}-{subject}-tutor-{nationality}". */
export function buildTutorSlugBase(params: { fullName: string; subject?: string; countryCode?: string; countryName?: string; nationalityCountryCode?: string }): string {
  const name = params.fullName || "tutor";
  const subject = params.subject || "tutor";
  const nationalityCountry = findCountryStrict(params.nationalityCountryCode) || findCountryStrict(params.countryCode);
  const nationality = countryNameToNationality(nationalityCountry?.name || params.countryName || "Pakistan");
  return slugify(`${name} ${subject} tutor ${nationality}`);
}

/**
 * Assigns a globally-unique slug to the profile (mutates `profile.slug`,
 * does not save). Regenerates only when the inputs that feed the slug
 * (name, primary subject, country, nationality) actually changed, so a
 * tutor's existing published URL doesn't silently break on every unrelated
 * profile edit. On a collision, appends "-2", "-3", etc. until free.
 */
export async function assignUniqueTutorSlug(profile: ITutorProfile, opts: { force?: boolean } = {}): Promise<void> {
  const base = buildTutorSlugBase({
    fullName: profile.fullName,
    subject: profile.subjects?.[0],
    countryCode: profile.countryCode,
    countryName: profile.countryName,
    nationalityCountryCode: profile.nationalityCountryCode,
  });

  if (!opts.force && profile.slug && profile.slug.replace(/-\d+$/, "") === base) {
    return; // Already matches current inputs (ignoring any "-2" collision suffix).
  }

  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await TutorProfile.findOne({ slug: candidate, _id: { $ne: profile._id } }).select("_id").lean();
    if (!existing) break;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  profile.slug = candidate;
  profile.countrySlug = countrySlugFromCode(profile.countryCode, profile.countryName);
}

export function buildTutorProfileUrl(profile: Pick<ITutorProfile, "slug" | "countrySlug">): string {
  return `/tutors/${profile.countrySlug || "pakistan"}/${profile.slug || ""}`;
}
