import { Request } from "express";
import { Document, Types } from "mongoose";

// User Roles
export type UserRole = "student" | "tutor" | "admin";

// User Document Interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  city?: string;
  avatar?: string;
  isVerified: boolean;
  isApproved: boolean;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUser;
}