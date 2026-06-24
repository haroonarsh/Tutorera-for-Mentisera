import { Request } from "express";
import { Document, Types } from "mongoose";

// User Roles
export type UserRole = "student" | "tutor" | "admin";
export type UserPlan = "free" | "standard" | "premium";

// User Document Interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  plan: UserPlan;
  bidsThisMonth: number;
  bidsResetDate: Date;
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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUser;
}