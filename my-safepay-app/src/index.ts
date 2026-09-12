import { Hono } from "hono";
import mongoose from "mongoose";

// Lightweight MongoDB PaymentLedger model mapping
const PaymentLedgerSchema = new mongoose.Schema({
  providerTransactionId: { type: String, required: true },
  eventType: { type: String, required: true },
  status: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", index: true },
  bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const PaymentLedger = mongoose.models.PaymentLedger || mongoose.model("PaymentLedger", PaymentLedgerSchema);

type Bindings = {
  MONGODB_URI: string;
  SAFEPAY_API_KEY: string;
  SAFEPAY_WEBHOOK_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// MongoDB Connection Middleware
app.use("*", async (c, next) => {
  if (mongoose.connection.readyState === 0) {
    if (!c.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
    // Connect to MongoDB
    await mongoose.connect(c.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }
  await next();
});

app.get("/", (c) => c.text("Safepay Worker is running!"));

app.post("/checkout", async (c) => {
  const body = await c.req.json();
  const { amount, currency, reference, studentId, bookingId, bidId, feeSnapshot, metadata } = body;
  
  if (!c.env.SAFEPAY_API_KEY) {
    return c.json({ error: "Safepay is not configured" }, 500);
  }

  try {
    // Generate Safepay checkout URL (Mocking SDK call for the edge)
    const checkoutUrl = `https://sandbox.api.getsafepay.com/checkout/pay?env=sandbox&api_key=${c.env.SAFEPAY_API_KEY}&amount=${amount}&currency=${currency}&reference=${reference}`;
    
    // Log to MongoDB directly
    await PaymentLedger.create({
      providerTransactionId: reference,
      eventType: "checkout.created",
      status: "pending",
      amount,
      currency,
      student: studentId || null,
      booking: bookingId || null,
      bid: bidId || null,
      metadata: { checkoutUrl, feeSnapshot, ...metadata },
    });

    return c.json({ checkoutUrl });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/webhook", async (c) => {
  const signature = c.req.header("x-sfpy-signature");
  const body = await c.req.json();

  if (!signature) return c.json({ error: "Missing signature" }, 401);
  
  // Verify signature using c.env.SAFEPAY_WEBHOOK_SECRET...
  // Safepay validation logic goes here...

  try {
    const reference = body.reference;
    
    // Update Ledger in MongoDB directly
    await PaymentLedger.findOneAndUpdate(
      { providerTransactionId: reference },
      { $set: { status: "completed", eventType: "payment.success" } },
      { new: true, upsert: true }
    );

    return c.json({ received: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
