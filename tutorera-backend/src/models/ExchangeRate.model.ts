// backend/src/models/ExchangeRate.model.ts
// Stores hourly-fetched exchange rates for all supported currencies (base: USD)

import mongoose, { Schema, Document } from "mongoose";

export interface IExchangeRate extends Document {
  base: string;           // Always "USD"
  rates: Record<string, number>; // { PKR: 278.5, AED: 3.67, … }
  source: string;         // e.g. "exchangerate.host"
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const exchangeRateSchema = new Schema<IExchangeRate>(
  {
    base: { type: String, default: "USD", uppercase: true, trim: true },
    rates: { type: Map, of: Number, required: true },
    source: { type: String, default: "exchangerate.host" },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Keep only the latest 7 days of snapshots (one per hour = 168 docs max)
exchangeRateSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export default mongoose.model<IExchangeRate>("ExchangeRate", exchangeRateSchema);
