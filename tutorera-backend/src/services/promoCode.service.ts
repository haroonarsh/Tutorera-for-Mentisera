import PromoCode from "../models/PromoCode.model";
import PromoCodeRedemption from "../models/PromoCodeRedemption.model";
import PaymentLedger from "../models/PaymentLedger.model";

export class PromoCodeError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function computeDiscount(promo: { discountType: "percentage" | "fixed"; discountValue: number; maxDiscountAmount?: number }, amount: number): number {
  let discount = promo.discountType === "percentage" ? (amount * promo.discountValue) / 100 : promo.discountValue;
  if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) discount = promo.maxDiscountAmount;
  if (discount > amount) discount = amount;
  return Math.round(discount * 100) / 100;
}

// Validates a code against a specific checkout and returns the discount to
// apply, without persisting anything - call this at checkout-creation time,
// before the payment gateway session is built, so the reduced amount is what
// actually gets charged.
export async function previewPromoDiscount(userId: string, userRole: string | undefined, code: string, amount: number): Promise<{ promoCodeId: string; code: string; discountAmount: number }> {
  const promoCode = await PromoCode.findOne({ code: String(code).trim().toUpperCase() });
  if (!promoCode) throw new PromoCodeError("Invalid promo code", 404);
  if (!promoCode.isActive) throw new PromoCodeError("This promo code is no longer active");
  const now = new Date();
  if (promoCode.validFrom > now) throw new PromoCodeError("This promo code is not active yet");
  if (promoCode.validUntil && promoCode.validUntil < now) throw new PromoCodeError("This promo code has expired");
  if (userRole && !promoCode.applicableRoles.includes(userRole as "student" | "parent")) {
    throw new PromoCodeError("This promo code isn't valid for your account type");
  }
  if (amount < promoCode.minBookingAmount) {
    throw new PromoCodeError(`This code requires a minimum booking amount of ${promoCode.minBookingAmount}`);
  }
  if (promoCode.maxRedemptions && promoCode.redemptionCount >= promoCode.maxRedemptions) {
    throw new PromoCodeError("This promo code has reached its redemption limit");
  }
  const userRedemptions = await PromoCodeRedemption.countDocuments({ promoCode: promoCode._id, user: userId, status: { $ne: "cancelled" } });
  if (userRedemptions >= promoCode.maxRedemptionsPerUser) {
    throw new PromoCodeError("You've already used this promo code the maximum number of times");
  }

  return { promoCodeId: promoCode._id.toString(), code: promoCode.code, discountAmount: computeDiscount(promoCode, amount) };
}

// Looks up the promo metadata a checkout was created with (stored on the
// PaymentLedger "checkout.created" entry for that basket) - called once
// payment is confirmed, so finalization doesn't need the promo code
// threaded through every intermediate model.
export async function getAppliedPromoForBasket(basketId: string): Promise<{ promoCodeId: string; code: string; discountAmount: number; originalAmount: number } | null> {
  const ledgerEntry = await PaymentLedger.findOne({ providerTransactionId: basketId, eventType: "checkout.created" }).sort("-createdAt");
  const promo = ledgerEntry?.metadata?.appliedPromo as { promoCodeId: string; code: string; discountAmount: number; originalAmount: number } | undefined;
  return promo || null;
}

// Records the official redemption once a booking backed by a promo-discounted
// checkout has actually been paid and created. Safe to call more than once
// for the same booking (idempotent) since webhook delivery is at-least-once.
export async function finalizePromoRedemption(promoCodeId: string, userId: string, bookingId: string, originalAmount: number, discountAmount: number): Promise<void> {
  const already = await PromoCodeRedemption.findOne({ promoCode: promoCodeId, booking: bookingId });
  if (already) return;

  await PromoCodeRedemption.create({
    promoCode: promoCodeId,
    user: userId,
    booking: bookingId,
    originalAmount,
    discountAmount,
    finalAmount: Math.round((originalAmount - discountAmount) * 100) / 100,
    status: "applied",
  });
  await PromoCode.updateOne({ _id: promoCodeId }, { $inc: { redemptionCount: 1 } });
}
