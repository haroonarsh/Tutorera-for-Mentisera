import mongoose, { Document, Schema, Types } from "mongoose";

export type PayoutState =
  | "pending"      // Identified as eligible; not yet sent to admin
  | "requested"    // Admin notified / manual transfer in progress
  | "completed"    // Admin confirmed transfer with evidence reference
  | "failed"       // Transfer failed; booking returns to payoutStatus=pending
  | "cancelled";   // Voided before transfer (e.g. booking disputed)

export interface ITutorPayout extends Document {
  /** Globally unique, stable reference for this transfer (PYOUT-<nanoid>). */
  transferRef: string;
  tutor: Types.ObjectId;
  /** Bookings included in this payout batch. */
  bookings: Types.ObjectId[];
  currency: string;
  totalAmount: number;
  state: PayoutState;
  /** ISO 4217 currency code — must match totalAmount denomination. */
  requestedAt: Date;
  /** Set by admin when they initiate the manual transfer. */
  dispatchedAt?: Date;
  /** Set only when admin supplies evidence of receipt. */
  completedAt?: Date;
  /** External reference the admin supplies (bank txn id, provider ref, etc.). */
  evidenceRef?: string;
  /** Admin who actioned the completion or failure. */
  actionedBy?: Types.ObjectId;
  /** Free-text note from admin (required on failure). */
  adminNote?: string;
  /** Ledger row created for this payout request. */
  ledgerEntry?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tutorPayoutSchema = new Schema<ITutorPayout>(
  {
    transferRef: { type: String, required: true, unique: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }],
    currency: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    state: {
      type: String,
      enum: ["pending", "requested", "completed", "failed", "cancelled"],
      required: true,
      default: "pending",
      index: true,
    },
    requestedAt: { type: Date, required: true },
    dispatchedAt: { type: Date },
    completedAt: { type: Date },
    evidenceRef: { type: String, trim: true },
    actionedBy: { type: Schema.Types.ObjectId, ref: "User" },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    ledgerEntry: { type: Schema.Types.ObjectId, ref: "PaymentLedger" },
  },
  { timestamps: true }
);

tutorPayoutSchema.index({ tutor: 1, state: 1, requestedAt: -1 });
tutorPayoutSchema.index({ state: 1, requestedAt: 1 });

export default mongoose.model<ITutorPayout>("TutorPayout", tutorPayoutSchema);
