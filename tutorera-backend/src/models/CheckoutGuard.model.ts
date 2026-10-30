import mongoose, { Schema } from "mongoose";

// The basket is the MongoDB _id, so uniqueness does not rely on autoIndex.
// A crashed or ambiguous attempt remains blocked for manual reconciliation.
const schema = new Schema({
  _id: { type: String, required: true },
  state: { type: String, enum: ["creating", "idle", "uncertain"], required: true },
  owner: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("CheckoutGuard", schema);
