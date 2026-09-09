// backend/src/services/pricing.service.ts
// Global fee and tax calculation engine.
// Replaces the hardcoded calculateMarketplaceFees() with a country-aware version
// that reads TaxConfig from the database and applies the correct VAT/GST rate.

import TaxConfig from "../models/TaxConfig.model";
import { convertAmount } from "./exchangeRate.service";

export interface FeeBreakdown {
  grossAmount: number;          // what the student pays (amount agreed)
  currency: string;             // ISO 4217 currency code
  studentFeeRate: number;       // % charged to student on top
  studentFee: number;
  studentTotal: number;         // grossAmount + studentFee
  platformFeeRate: number;      // % taken from tutor's side
  platformFee: number;
  taxRate: number;              // % tax (VAT / GST)
  taxAmount: number;
  taxType: string;              // "VAT", "GST", etc.
  tutorNet: number;             // what the tutor receives after fees & tax
  tutorFee: number;             // platform fee on tutor side
  platformNet: number;          // platform's gross revenue
  amountUSD?: number;           // normalised USD equivalent
}

// Default platform fee rates (overrideable by MarketConfig in future)
const STUDENT_FEE_RATE = 0.05;  // 5% service fee on top of agreed amount
const PLATFORM_FEE_RATE = 0.15; // 15% commission from tutor's payment

/** Static fallback — used when no TaxConfig is found for a country */
const DEFAULT_TAX_CONFIG = { rate: 0, taxType: "none", name: "None" };

/**
 * Calculate all fees and tax for a given booking amount.
 *
 * @param amount      - The agreed tuition amount (in the given currency)
 * @param currency    - ISO 4217 currency of the transaction (e.g. "PKR")
 * @param countryCode - ISO 3166-1 alpha-2 country code for tax lookup (e.g. "PK")
 * @param mode        - "online" | "in-person" | "both" — affects DST applicability
 */
export async function calculateFees(
  amount: number,
  currency: string,
  countryCode = "PK",
  mode: "online" | "in-person" | "both" = "online"
): Promise<FeeBreakdown> {
  // 1. Fetch tax config for this country
  const taxCfg = await TaxConfig.findOne({
    countryCode: countryCode.toUpperCase(),
    isActive: true,
  }).lean() ?? DEFAULT_TAX_CONFIG;

  const taxRate = taxCfg.rate / 100;
  const taxType = (taxCfg as any).taxType ?? "none";
  const taxApplies = mode === "in-person"
    ? (taxCfg as any).appliesHomeTuition !== false
    : (taxCfg as any).appliesOnlineServices !== false;

  // 2. Student fee (added on top of agreed amount)
  const studentFee = Math.round(amount * STUDENT_FEE_RATE);
  const studentTotal = amount + studentFee;

  // 3. Platform fee (deducted from tutor's received payment)
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE);

  // 4. Tax (applied to platform revenue if platform is the collector)
  const taxableBase = platformFee + studentFee;
  const taxAmount = taxApplies && (taxCfg as any).platformCollects !== false
    ? Math.round(taxableBase * taxRate)
    : 0;

  // 5. Tutor receives the gross amount minus the platform cut
  const tutorNet = amount - platformFee;

  // 6. Platform net = fees collected - tax remitted
  const platformNet = studentFee + platformFee - taxAmount;

  // 7. Normalise to USD for analytics
  let amountUSD: number | undefined;
  try {
    amountUSD = await convertAmount(amount, currency, "USD");
    amountUSD = Math.round(amountUSD * 100) / 100;
  } catch { /* non-critical */ }

  return {
    grossAmount: amount,
    currency: (currency || "PKR").toUpperCase(),
    studentFeeRate: STUDENT_FEE_RATE * 100,
    studentFee,
    studentTotal,
    platformFeeRate: PLATFORM_FEE_RATE * 100,
    platformFee,
    taxRate: taxCfg.rate,
    taxAmount,
    taxType,
    tutorNet,
    tutorFee: platformFee,
    platformNet,
    amountUSD,
  };
}

/**
 * Lightweight synchronous version using hardcoded rates — for use in
 * non-async contexts (e.g. validators) where DB access is not available.
 */
export function calculateFeesSync(amount: number, currency = "PKR"): FeeBreakdown {
  const studentFee = Math.round(amount * STUDENT_FEE_RATE);
  const studentTotal = amount + studentFee;
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
  const tutorNet = amount - platformFee;
  const platformNet = studentFee + platformFee;

  return {
    grossAmount: amount,
    currency: currency.toUpperCase(),
    studentFeeRate: STUDENT_FEE_RATE * 100,
    studentFee,
    studentTotal,
    platformFeeRate: PLATFORM_FEE_RATE * 100,
    platformFee,
    taxRate: 0,
    taxAmount: 0,
    taxType: "none",
    tutorNet,
    tutorFee: platformFee,
    platformNet,
  };
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
