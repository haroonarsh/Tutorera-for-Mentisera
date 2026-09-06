import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [
        function (this: IUser) {
          return this.authProvider === "local";
        },
        "Password is required",
      ],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "tutor", "admin", "pending", "parent"],
      default: "student",
    },
    adminRole: {
      type: String,
      enum: [
        "super_admin",
        "marketplace_operations",
        "student_success",
        "tutor_operations",
        "verification_officer",
        "trust_and_safety",
        "finance",
        "support",
        "growth",
        "content",
        "analyst",
      ],
      default: "super_admin",
    },
    adminPermissions: [{ type: String }],
    plan: {
      type: String,
      enum: ["free", "standard", "premium"],
      default: "free",
    },
    bidsThisMonth: {
      type: Number,
      default: 0,
    },
    bidsResetDate: {
      type: Date,
      default: Date.now,
    },
    requestsThisMonth: {
      type: Number,
      default: 0,
    },
    requestsResetDate: {
      type: Date,
      default: Date.now,
    },
    phone: { type: String, trim: true },
    countryCode: { type: String, trim: true, default: "PK" },
    countryName: { type: String, trim: true, default: "Pakistan" },
    city: { type: String, trim: true, default: "Lahore" },
    timezone: { type: String, trim: true, default: "Asia/Karachi" },
    currency: { type: String, trim: true, default: "PKR" },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    referralCode: { type: String, unique: true, sparse: true },
    referralCredit: { type: Number, default: 0 },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ── Tutor Application Tracking ──
    applicationId: { type: String, unique: true, sparse: true, index: true },
    trackingTokenHash: { type: String, unique: true, sparse: true, index: true },
    trackingTokenCreatedAt: { type: Date },
    trackingTokenRotatedAt: { type: Date },
    applicationSubmittedAt: { type: Date },

    // ── Legal, Privacy & Compliance ──
    legalTermsVersionAccepted: { type: String, default: "2026.2-GLOBAL" },
    privacyVersionAccepted: { type: String, default: "2026.2-GLOBAL" },
    legalAcceptedAt: { type: Date, default: Date.now },
    legalAcceptedIp: { type: String },
    parentConsentVerified: { type: Boolean, default: false },
    parentGuardianEmail: { type: String, trim: true },
    parentGuardianName: { type: String, trim: true },
    children: [{ type: Schema.Types.ObjectId, ref: "User" }],
    dateOfBirth: { type: Date },
    isMinor: { type: Boolean, default: false },
    marketingConsent: { type: Boolean, default: false },
    cookieConsent: {
      necessary: { type: Boolean, default: true },
      analytics: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
      updatedAt: { type: Date, default: Date.now },
    },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
      bidNotifications: { type: Boolean, default: true },
      chatMessages: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      platformUpdates: { type: Boolean, default: false },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletionReason: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !(this as any).password) return;
  (this as any).password = await bcrypt.hash((this as any).password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);