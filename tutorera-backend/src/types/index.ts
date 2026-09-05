import { Request } from "express";
import { Document, Types } from "mongoose";

// User Roles
export type UserRole = "student" | "tutor" | "admin" | "pending";
export type UserPlan = "free" | "standard" | "premium";
export type AuthProvider = "local" | "google";

// User Document Interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  plan: UserPlan;
  bidsThisMonth: number;
  bidsResetDate: Date;
  requestsThisMonth: number;
  requestsResetDate: Date;
  phone?: string;
  city?: string;
  avatar?: string;
  isVerified: boolean;
  isApproved: boolean;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  referralCode?: string;
  referralCredit: number;
  referredBy?: Types.ObjectId;
  googleId?: string;
  authProvider: AuthProvider;
  countryCode?: string;
  countryName?: string;
  timezone?: string;
  currency?: string;
  applicationId?: string;
  trackingTokenHash?: string;
  trackingTokenCreatedAt?: Date;
  trackingTokenRotatedAt?: Date;
  applicationSubmittedAt?: Date;

  // ── Legal, Privacy & Compliance ──
  legalTermsVersionAccepted?: string;
  privacyVersionAccepted?: string;
  legalAcceptedAt?: Date;
  legalAcceptedIp?: string;
  parentConsentVerified?: boolean;
  parentGuardianEmail?: string;
  parentGuardianName?: string;
  dateOfBirth?: Date;
  isMinor?: boolean;
  marketingConsent?: boolean;
  cookieConsent?: { necessary: boolean; analytics: boolean; marketing: boolean; updatedAt: Date };
  isDeleted?: boolean;
  deletedAt?: Date;
  deletionReason?: string;

  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUser;
}