// backend/src/services/pricing.service.ts
// The single, authoritative fee/tax calculation engine for every booking.
// Reads FeeConfig (TutorEra's own commission + payment gateway processing
// cost) and TaxConfig (per-country government tax) from the database instead
// of the hardcoded constants this replaces, so both admin config pages
// actually control the numbers charged to real students and paid to real
// tutors.

import FeeConfig from "../models/FeeConfig.model";
import TaxConfig from "../models/TaxConfig.model";

export interface MarketplaceFees {
  subtotal: number;        // the agreed tuition rate
  studentFee: number;      // TutorEra's service fee, added on top for the student
  studentTotal: number;    // subtotal + studentFee - what the student is actually charged
  tutorFee: number;        // TutorEra's commission, deducted from the tutor's side
  tax: number;             // government tax (VAT/GST/service tax), per TaxConfig
  taxType: string;         // "VAT" | "GST" | "service_tax" | "DST" | "none"
  gatewayFee: number;      // payment gateway's own processing cost, absorbed by the platform
  tutorNet: number;        // subtotal - tutorFee - tax = what the tutor actually receives
  currency: string;
  countryCode: string;
  feeConfig: {
    studentFeePercent: number;
    tutorFeePercent: number;
    minimumFee: number;
    maximumFee: number;
    gatewayFeePercent: number;
    gatewayFixedFee: number;
    taxRatePercent: number;
    version: string;
  };
}

// Bootstrapping fallback only - used the first time the server ever runs,
// before an admin has saved a FeeConfig record. Once a record exists,
// getActiveFeeConfig() always uses the real one from the database.
const DEFAULT_FEE_CONFIG = {
  studentFeePercent: 0,
  tutorFeePercent: 20,
  minimumFee: 0,
  maximumFee: 5000,
  gatewayFeePercent: 2.9,
  gatewayFixedFee: 0,
};

async function getActiveFeeConfig() {
  const active = await FeeConfig.findOne({ isActive: true }).sort("-updatedAt").lean();
  if (active) return active;
  return { version: "default", ...DEFAULT_FEE_CONFIG };
}

async function getTaxConfigForCountry(countryCode: string) {
  const cfg = await TaxConfig.findOne({ countryCode: countryCode.toUpperCase(), isActive: true }).lean();
  return cfg || { rate: 0, taxType: "none" as const, platformCollects: true, appliesOnlineServices: true, appliesHomeTuition: true };
}

function clampFee(rawFee: number, minimumFee: number, maximumFee: number): number {
  if (rawFee < minimumFee) return minimumFee;
  if (maximumFee > 0 && rawFee > maximumFee) return maximumFee;
  return rawFee;
}

/**
 * Calculate every fee, commission, tax, and gateway cost for a booking.
 *
 * @param subtotal    - the agreed tuition rate (before any fees)
 * @param opts.currency    - ISO 4217 currency of the transaction (e.g. "PKR")
 * @param opts.countryCode - ISO 3166-1 alpha-2 country for tax lookup (e.g. "PK")
 * @param opts.teachingMode - affects whether tax applies (online vs home tuition can differ per country)
 */
export async function calculateMarketplaceFees(
  subtotal: number,
  opts: { currency?: string; countryCode?: string; teachingMode?: "online" | "in-person" | "both" } = {}
): Promise<MarketplaceFees> {
  const currency = (opts.currency || "PKR").toUpperCase();
  const countryCode = (opts.countryCode || "PK").toUpperCase();
  const teachingMode = opts.teachingMode || "online";

  const [feeCfg, taxCfg] = await Promise.all([
    getActiveFeeConfig(),
    getTaxConfigForCountry(countryCode),
  ]);

  const studentFee = clampFee(
    Math.round(subtotal * feeCfg.studentFeePercent / 100),
    feeCfg.minimumFee,
    feeCfg.maximumFee
  );
  const tutorFee = clampFee(
    Math.round(subtotal * feeCfg.tutorFeePercent / 100),
    feeCfg.minimumFee,
    feeCfg.maximumFee
  );
  const studentTotal = subtotal + studentFee;

  const taxApplies = teachingMode === "in-person"
    ? taxCfg.appliesHomeTuition !== false
    : taxCfg.appliesOnlineServices !== false;
  const tax = taxApplies && taxCfg.platformCollects !== false
    ? Math.round(tutorFee * (taxCfg.rate || 0) / 100)
    : 0;

  // The gateway charges on the full amount that actually flows through it -
  // the student's total checkout amount - and this cost is absorbed by the
  // platform's own margin, never deducted from the tutor's payout.
  const gatewayFee = Math.round(studentTotal * feeCfg.gatewayFeePercent / 100 + feeCfg.gatewayFixedFee);

  const tutorNet = subtotal - tutorFee - tax;

  return {
    subtotal,
    studentFee,
    studentTotal,
    tutorFee,
    tax,
    taxType: taxCfg.taxType || "none",
    gatewayFee,
    tutorNet,
    currency,
    countryCode,
    feeConfig: {
      studentFeePercent: feeCfg.studentFeePercent,
      tutorFeePercent: feeCfg.tutorFeePercent,
      minimumFee: feeCfg.minimumFee,
      maximumFee: feeCfg.maximumFee,
      gatewayFeePercent: feeCfg.gatewayFeePercent,
      gatewayFixedFee: feeCfg.gatewayFixedFee,
      taxRatePercent: taxCfg.rate || 0,
      version: (feeCfg as any).version || "default",
    },
  };
}

/**
 * A promo code applied after calculateMarketplaceFees() reduces studentFee/
 * studentTotal - gatewayFee was computed against the pre-discount amount, but
 * the gateway only ever sees what's actually charged. Call this after
 * mutating fees.studentFee/studentTotal for a promo discount to keep
 * gatewayFee accurate. Mutates and returns the same object.
 */
export function recomputeGatewayFee(fees: MarketplaceFees): MarketplaceFees {
  fees.gatewayFee = Math.round(fees.studentTotal * fees.feeConfig.gatewayFeePercent / 100 + fees.feeConfig.gatewayFixedFee);
  return fees;
}

/**
 * Seed default TaxConfig records for launch markets (idempotent — uses upsert).
 * Call this from a migration script or server boot (dev-only).
 */
export async function seedTaxConfigs(): Promise<void> {
  const configs = [
    { countryCode: "PK", taxType: "none",        rate: 0,   name: "No Tax",           platformCollects: true,  invoiceRequired: false, appliesOnlineServices: true, appliesHomeTuition: true  },
    { countryCode: "AE", taxType: "VAT",          rate: 5,   name: "VAT (5%)",          platformCollects: true,  invoiceRequired: true,  appliesOnlineServices: true, appliesHomeTuition: true  },
    { countryCode: "GB", taxType: "VAT",          rate: 20,  name: "VAT (20%)",         platformCollects: true,  invoiceRequired: true,  appliesOnlineServices: true, appliesHomeTuition: true  },
    { countryCode: "AU", taxType: "GST",          rate: 10,  name: "GST (10%)",         platformCollects: true,  invoiceRequired: true,  appliesOnlineServices: true, appliesHomeTuition: true  },
    { countryCode: "CA", taxType: "GST",          rate: 5,   name: "GST (5%)",          platformCollects: true,  invoiceRequired: true,  appliesOnlineServices: true, appliesHomeTuition: false },
    { countryCode: "IN", taxType: "GST",          rate: 18,  name: "GST (18%)",         platformCollects: true,  invoiceRequired: true,  appliesOnlineServices: true, appliesHomeTuition: false },
    { countryCode: "SA", taxType: "VAT",          rate: 15,  name: "VAT (15%)",         platformCollects: true,  invoiceRequired: true,  appliesOnlineServices: true, appliesHomeTuition: true  },
    { countryCode: "US", taxType: "service_tax",  rate: 0,   name: "No Federal Tax",    platformCollects: false, invoiceRequired: false, appliesOnlineServices: false, appliesHomeTuition: false },
  ];

  for (const cfg of configs) {
    await TaxConfig.findOneAndUpdate(
      { countryCode: cfg.countryCode },
      { $setOnInsert: { ...cfg, isActive: true } },
      { upsert: true, new: true }
    );
  }

  console.log("[TaxConfig] Seeded default tax configs for", configs.length, "countries.");
}
