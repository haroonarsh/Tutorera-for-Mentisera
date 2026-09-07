import { Types } from "mongoose";
import Bid from "../models/Bid.model";
import Request, { IRequest } from "../models/Request.model";

export type RequestLossReason =
  | "no_tutor_supply"
  | "no_tutor_response"
  | "budget_mismatch"
  | "offers_too_expensive"
  | "location_restriction"
  | "student_abandoned"
  | "student_cancelled"
  | "payment_failed"
  | "tutor_cancelled"
  | "request_expired"
  | "other";

type LossInput = {
  requestId: string | Types.ObjectId;
  explicitReason?: RequestLossReason;
  detail?: string;
  signals?: Record<string, unknown>;
};

const TERMINAL_LOSS_STATUSES = ["cancelled", "expired", "closed"] as const;

function normalizeAmount(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function inferLossReason(request: IRequest, offerRows: Array<{ amount?: number; status?: string }>): { reason: RequestLossReason; signals: Record<string, unknown> } {
  const totalOffers = offerRows.length;
  const activeOrAcceptedOffers = offerRows.filter((offer) => ["submitted", "viewed", "countered", "payment_pending", "accepted"].includes(String(offer.status))).length;
  const withdrawnOrRejectedOffers = offerRows.filter((offer) => ["withdrawn", "rejected", "not_selected"].includes(String(offer.status))).length;
  const proposedBudget = normalizeAmount(request.budget);
  const privateMaximumBudget = normalizeAmount(request.maximumBudget);
  const budgetCeiling = privateMaximumBudget || proposedBudget;
  const offerAmounts = offerRows.map((offer) => normalizeAmount(offer.amount)).filter((amount): amount is number => Boolean(amount));
  const minimumOffer = offerAmounts.length ? Math.min(...offerAmounts) : undefined;
  const averageOffer = offerAmounts.length ? offerAmounts.reduce((sum, amount) => sum + amount, 0) / offerAmounts.length : undefined;
  const allOffersAboveBudget = Boolean(budgetCeiling && offerAmounts.length && offerAmounts.every((amount) => amount > budgetCeiling));
  const muchHigherThanBudget = Boolean(budgetCeiling && minimumOffer && minimumOffer > budgetCeiling * 1.2);

  const signals: Record<string, unknown> = {
    totalOffers,
    activeOrAcceptedOffers,
    withdrawnOrRejectedOffers,
    proposedBudget,
    hasPrivateMaximumBudget: Boolean(privateMaximumBudget),
    minimumOffer,
    averageOffer,
    teachingMode: request.teachingMode,
    city: request.city,
    countryCode: request.countryCode,
  };

  if (totalOffers === 0) {
    return { reason: "no_tutor_supply", signals };
  }

  if (allOffersAboveBudget || muchHigherThanBudget) {
    return { reason: "offers_too_expensive", signals };
  }

  if (request.teachingMode === "in-person" && !request.isWorldwideEligible && !request.city) {
    return { reason: "location_restriction", signals };
  }

  if (activeOrAcceptedOffers === 0 && withdrawnOrRejectedOffers > 0) {
    return { reason: "no_tutor_response", signals };
  }

  if (request.status === "expired") {
    return { reason: "request_expired", signals };
  }

  return { reason: "other", signals };
}

export async function classifyRequestLoss({ requestId, explicitReason, detail, signals = {} }: LossInput) {
  const request = await Request.findById(requestId).select("+maximumBudget");
  if (!request) return null;

  if (!explicitReason && !(TERMINAL_LOSS_STATUSES as readonly string[]).includes(request.status)) {
    return request;
  }

  const offers = await Bid.find({ request: request._id }).select("amount status").lean();
  const inferred = explicitReason
    ? { reason: explicitReason, signals: { totalOffers: offers.length } }
    : inferLossReason(request, offers);

  request.lossReason = inferred.reason;
  request.lossReasonDetail = detail || request.lossReasonDetail;
  request.lossSignals = {
    ...inferred.signals,
    ...signals,
    classifiedFromStatus: request.status,
  };
  request.lossClassifiedAt = new Date();
  await request.save();
  return request;
}
