import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationCategory =
  | "auth"
  | "request"
  | "matching"
  | "offer"
  | "negotiation"
  | "booking"
  | "session"
  | "payment"
  | "payout"
  | "verification"
  | "review"
  | "message"
  | "support"
  | "safety"
  | "account"
  | "growth"
  | "system"
  | "bid"
  | "general"
  | "broadcast";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationCategory;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  eventId?: string;
  channelsSent?: string[];
  metadata?: Record<string, any>;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      default: "general",
      index: true,
    },
    category: {
      type: String,
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
    },
    eventId: { type: String, index: true },
    channelsSent: { type: [String], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>("Notification", notificationSchema);