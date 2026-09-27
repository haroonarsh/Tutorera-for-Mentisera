import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITutorAgreementConsents {
  consentAgreement: boolean;
  consentInformationAccuracy: boolean;
  consentSafeguarding: boolean;
  consentIndependentContractor: boolean;
  consentFeesTaxes: boolean;
  consentElectronicRecords: boolean;
}

export interface ITutorAgreementAcceptance extends Document {
  tutor: Types.ObjectId; // User._id
  tutorProfile: Types.ObjectId; // TutorProfile._id
  legalAgreement: Types.ObjectId; // LegalAgreement._id
  agreementVersion: string;
  agreementHash: string; // SHA-256
  country: string;
  locale: string;
  legalNameAtAcceptance: string;
  electronicSignature: string; // Typed full legal name
  acceptedAt: Date;
  effectiveAt: Date;
  ipAddress?: string;
  userAgent?: string;
  consents: ITutorAgreementConsents;
  feeDisclosureSnapshot: {
    marketplaceFeePercent: number;
    taxRatePercent: number;
    currency: string;
    effectiveFrom: string;
  };
  contractSnapshot: {
    title: string;
    version: string;
    content: string;
    applicableSchedule?: string;
    companyLegalName: string;
    tradingName: string;
    registeredAddress: string;
    contactEmail: string;
  };
  adminApprovalId?: string;
  adminApprovedBy?: Types.ObjectId;
  adminApprovedAt?: Date;
  acceptanceStatus: "active" | "superseded" | "revoked";
  supersededBy?: Types.ObjectId;
  supersededAt?: Date;
  pdfGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tutorAgreementAcceptanceSchema = new Schema<ITutorAgreementAcceptance>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutorProfile: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    legalAgreement: { type: Schema.Types.ObjectId, ref: "LegalAgreement", required: true, index: true },
    agreementVersion: { type: String, required: true, trim: true, index: true },
    agreementHash: { type: String, required: true, trim: true },
    country: { type: String, required: true, uppercase: true, trim: true, default: "PK" },
    locale: { type: String, required: true, default: "en" },
    legalNameAtAcceptance: { type: String, required: true, trim: true },
    electronicSignature: { type: String, required: true, trim: true },
    acceptedAt: { type: Date, required: true, default: Date.now },
    effectiveAt: { type: Date, required: true, default: Date.now },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true, maxlength: 500 },
    consents: {
      consentAgreement: { type: Boolean, required: true },
      consentInformationAccuracy: { type: Boolean, required: true },
      consentSafeguarding: { type: Boolean, required: true },
      consentIndependentContractor: { type: Boolean, required: true },
      consentFeesTaxes: { type: Boolean, required: true },
      consentElectronicRecords: { type: Boolean, required: true },
    },
    feeDisclosureSnapshot: {
      marketplaceFeePercent: { type: Number, required: true },
      taxRatePercent: { type: Number, required: true },
      currency: { type: String, required: true },
      effectiveFrom: { type: String, required: true },
    },
    contractSnapshot: {
      title: { type: String, required: true },
      version: { type: String, required: true },
      content: { type: String, required: true },
      applicableSchedule: { type: String, default: "" },
      companyLegalName: { type: String, required: true },
      tradingName: { type: String, required: true },
      registeredAddress: { type: String, required: true },
      contactEmail: { type: String, required: true },
    },
    adminApprovalId: { type: String },
    adminApprovedBy: { type: Schema.Types.ObjectId, ref: "User" },
    adminApprovedAt: { type: Date },
    acceptanceStatus: {
      type: String,
      enum: ["active", "superseded", "revoked"],
      default: "active",
      index: true,
    },
    supersededBy: { type: Schema.Types.ObjectId, ref: "TutorAgreementAcceptance" },
    supersededAt: { type: Date },
    pdfGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

// Idempotency: Prevent duplicate active acceptance of the exact same agreement version by the same tutor
tutorAgreementAcceptanceSchema.index({ tutor: 1, legalAgreement: 1 }, { unique: true });
tutorAgreementAcceptanceSchema.index({ tutor: 1, acceptanceStatus: 1, acceptedAt: -1 });

export default mongoose.model<ITutorAgreementAcceptance>(
  "TutorAgreementAcceptance",
  tutorAgreementAcceptanceSchema
);
