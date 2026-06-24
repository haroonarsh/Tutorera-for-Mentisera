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
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "tutor", "admin"],
      default: "student",
    },
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
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    referralCode: { type: String, unique: true, sparse: true },
    referralCredit: { type: Number, default: 0 },       // PKR credit balance
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password as string, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);