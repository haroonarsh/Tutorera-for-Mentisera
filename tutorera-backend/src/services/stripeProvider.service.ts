import Stripe from "stripe";
import { recordPaymentLedger } from "./paymentProvider.service";
import logger from "../config/logger";
import { FeeSnapshot } from "./paymentProvider.service";

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:3000";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock");

export interface StripeCheckoutParams {
  amount: number;
  currency: string;
  customerEmail: string;
  basketId: string;
  description: string;
  successUrl: string;
  failureUrl: string;
  bookingId?: string;
  bidId?: string;
  studentId?: string;
  tutorId?: string;
  feeSnapshot?: FeeSnapshot;
}

export const stripeProvider = {
  name: "stripe" as const,

  async createCheckout(params: StripeCheckoutParams): Promise<string> {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: params.customerEmail,
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: params.description,
              },
              unit_amount: Math.round(params.amount * 100), // Stripe expects cents/smallest unit
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: params.successUrl,
        cancel_url: params.failureUrl,
        client_reference_id: params.basketId,
        metadata: {
          basketId: params.basketId,
          bookingId: params.bookingId || "",
          bidId: params.bidId || "",
          studentId: params.studentId || "",
          tutorId: params.tutorId || "",
        },
      });

      await recordPaymentLedger({
        providerTransactionId: session.id,
        eventType: "checkout.created",
        status: "pending",
        amount: params.amount,
        currency: params.currency,
        bookingId: params.bookingId,
        bidId: params.bidId,
        studentId: params.studentId,
        tutorId: params.tutorId,
        feeSnapshot: params.feeSnapshot,
        metadata: { checkoutUrl: session.url, stripeSessionId: session.id },
      });

      return session.url as string;
    } catch (error) {
      logger.error({ error, params }, "Stripe createCheckout failed");
      throw { statusCode: 502, message: "Failed to initialize Stripe checkout" };
    }
  },

  verifyWebhookSignature(payload: string | Buffer, signature: string): any {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";
    return stripe.webhooks.constructEvent(payload, signature, secret);
  },
};
