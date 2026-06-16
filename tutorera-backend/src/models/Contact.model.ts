import mongoose, { Schema, Document } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;

  // ── Support request fields (NEW) ──
  type: "general" | "support";
  bookingId?: string;
  userRole?: "student" | "tutor";
  priority?: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "resolved";

  createdAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, minlength: 10 },
    isRead: { type: Boolean, default: false },

    // NEW
    type: { type: String, enum: ["general", "support"], default: "general" },
    bookingId: { type: String, default: "" },
    userRole: { type: String, enum: ["student", "tutor"], default: undefined },
    priority: { type: String, enum: ["low", "normal", "urgent"], default: "normal" },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model<IContact>("Contact", contactSchema);