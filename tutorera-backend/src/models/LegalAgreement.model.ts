import mongoose, { Document, Schema, Types } from "mongoose";

export type AgreementDocumentType =
  | "TUTOR_AGREEMENT"
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "SAFEGUARDING_POLICY"
  | "HOME_TUITION_TERMS"
  | "ONLINE_TUTORING_TERMS";

export type AgreementStatus = "draft" | "published" | "archived";

export interface ILegalAgreement extends Document {
  documentType: AgreementDocumentType;
  version: string; // e.g. "TTA-2026.1"
  title: string;
  content: string; // full markdown/text of the master agreement
  applicableSchedule?: string; // e.g. Pakistan Legal Schedule or country-specific addendum
  country: string; // ISO 2-letter, e.g. "PK", "UK", "AE", or "GLOBAL"
  locale: string; // e.g. "en"
  status: AgreementStatus;
  isCurrent: boolean;
  requiresReacceptance: boolean;
  contentHash: string; // SHA-256 hash of (content + (applicableSchedule || ""))
  effectiveDate: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  complianceDeadline?: Date; // For material updates requiring reacceptance
  feeScheduleSnapshot?: {
    marketplaceFeePercent: number;
    taxRatePercent: number;
    currency: string;
    effectiveFrom: string;
  };
  companyDetails?: {
    legalName: string;
    tradingName: string;
    registeredAddress: string;
    contactEmail: string;
  };
  createdBy?: Types.ObjectId;
  publishedBy?: Types.ObjectId;
  changelogNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const legalAgreementSchema = new Schema<ILegalAgreement>(
  {
    documentType: {
      type: String,
      required: true,
      enum: [
        "TUTOR_AGREEMENT",
        "TERMS_OF_SERVICE",
        "PRIVACY_POLICY",
        "SAFEGUARDING_POLICY",
        "HOME_TUITION_TERMS",
        "ONLINE_TUTORING_TERMS",
      ],
      default: "TUTOR_AGREEMENT",
      index: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    applicableSchedule: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "PK",
      index: true,
    },
    locale: {
      type: String,
      required: true,
      trim: true,
      default: "en",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    requiresReacceptance: {
      type: Boolean,
      default: false,
    },
    contentHash: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    publishedAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
    },
    complianceDeadline: {
      type: Date,
    },
    feeScheduleSnapshot: {
      marketplaceFeePercent: { type: Number, default: 20 },
      taxRatePercent: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      effectiveFrom: { type: String, default: "2026-08-30" },
    },
    companyDetails: {
      legalName: { type: String, default: "MENTISERA (SMC-Private) Limited" },
      tradingName: { type: String, default: "TUTORERA®" },
      registeredAddress: {
        type: String,
        default:
          "House 387, Street 11, Phase 5-B, Ghauri Town, Islamabad, Islamabad Capital Territory, Pakistan",
      },
      contactEmail: { type: String, default: "hello@mentisera.pk" },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changelogNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound indexes for querying active/published agreement per document type and country
legalAgreementSchema.index({ documentType: 1, country: 1, isCurrent: 1 });
legalAgreementSchema.index({ documentType: 1, country: 1, status: 1 });
legalAgreementSchema.index({ documentType: 1, version: 1, country: 1 }, { unique: true });

export default mongoose.model<ILegalAgreement>("LegalAgreement", legalAgreementSchema);
