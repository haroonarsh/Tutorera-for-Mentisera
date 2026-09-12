import { Response } from "express";
import { AuthRequest } from "../types";
import PromoCode from "../models/PromoCode.model";
import PromoCodeRedemption from "../models/PromoCodeRedemption.model";

function computeDiscount(promo: { discountType: "percentage" | "fixed"; discountValue: number; maxDiscountAmount?: number }, amount: number): number {
  let discount = promo.discountType === "percentage" ? (amount * promo.discountValue) / 100 : promo.discountValue;
  if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) discount = promo.maxDiscountAmount;
  if (discount > amount) discount = amount;
  return Math.round(discount * 100) / 100;
}

// ─── Admin: CRUD ────────────────────────────────────────────────────────────

// @desc    Create a promo code
// @route   POST /api/admin/promo-codes
// @access  Private (admin)
export const createPromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, description, discountType, discountValue, maxDiscountAmount, minBookingAmount, maxRedemptions, maxRedemptionsPerUser, applicableRoles, validFrom, validUntil } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    res.status(400).json({ success: false, message: "Code, discount type, and discount value are required" });
    return;
  }
  if (!["percentage", "fixed"].includes(discountType)) {
    res.status(400).json({ success: false, message: "Discount type must be 'percentage' or 'fixed'" });
    return;
  }
  if (discountType === "percentage" && discountValue > 100) {
    res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100" });
    return;
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const existing = await PromoCode.findOne({ code: normalizedCode });
  if (existing) {
    res.status(400).json({ success: false, message: "A promo code with this code already exists" });
    return;
  }

  const promoCode = await PromoCode.create({
    code: normalizedCode,
    description: description || "",
    discountType,
    discountValue,
    maxDiscountAmount,
    minBookingAmount: minBookingAmount || 0,
    maxRedemptions,
    maxRedemptionsPerUser: maxRedemptionsPerUser || 1,
    applicableRoles: applicableRoles?.length ? applicableRoles : ["student", "parent"],
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: validUntil ? new Date(validUntil) : undefined,
    createdBy: req.user?._id,
  });

  res.status(201).json({ success: true, promoCode });
};

// @desc    List all promo codes with usage stats
// @route   GET /api/admin/promo-codes
// @access  Private (admin)
export const listPromoCodes = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, isActive } = req.query;
  const filter: Record<string, unknown> = {};
  if (search) filter.code = new RegExp(String(search), "i");
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";

  const promoCodes = await PromoCode.find(filter).sort("-createdAt");
  res.status(200).json({ success: true, total: promoCodes.length, promoCodes });
};

// @desc    Get a single promo code with its full redemption history
// @route   GET /api/admin/promo-codes/:id
// @access  Private (admin)
export const getPromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) {
    res.status(404).json({ success: false, message: "Promo code not found" });
    return;
  }
  const redemptions = await PromoCodeRedemption.find({ promoCode: promoCode._id })
    .populate("user", "name email role")
    .populate("booking", "amount schedule createdAt")
    .sort("-createdAt");

  res.status(200).json({ success: true, promoCode, redemptions });
};

// @desc    Update a promo code
// @route   PUT /api/admin/promo-codes/:id
// @access  Private (admin)
export const updatePromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const { description, discountType, discountValue, maxDiscountAmount, minBookingAmount, maxRedemptions, maxRedemptionsPerUser, applicableRoles, validFrom, validUntil, isActive } = req.body;

  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) {
    res.status(404).json({ success: false, message: "Promo code not found" });
    return;
  }

  if (discountType && !["percentage", "fixed"].includes(discountType)) {
    res.status(400).json({ success: false, message: "Discount type must be 'percentage' or 'fixed'" });
    return;
  }

  if (description !== undefined) promoCode.description = description;
  if (discountType !== undefined) promoCode.discountType = discountType;
  if (discountValue !== undefined) promoCode.discountValue = discountValue;
  if (maxDiscountAmount !== undefined) promoCode.maxDiscountAmount = maxDiscountAmount;
  if (minBookingAmount !== undefined) promoCode.minBookingAmount = minBookingAmount;
  if (maxRedemptions !== undefined) promoCode.maxRedemptions = maxRedemptions;
  if (maxRedemptionsPerUser !== undefined) promoCode.maxRedemptionsPerUser = maxRedemptionsPerUser;
  if (applicableRoles !== undefined) promoCode.applicableRoles = applicableRoles;
  if (validFrom !== undefined) promoCode.validFrom = new Date(validFrom);
  if (validUntil !== undefined) promoCode.validUntil = validUntil ? new Date(validUntil) : undefined;
  if (isActive !== undefined) promoCode.isActive = isActive;

  await promoCode.save();
  res.status(200).json({ success: true, promoCode });
};

// @desc    Delete a promo code (only if it has never been redeemed - otherwise deactivate it)
// @route   DELETE /api/admin/promo-codes/:id
// @access  Private (admin)
export const deletePromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) {
    res.status(404).json({ success: false, message: "Promo code not found" });
    return;
  }
  if (promoCode.redemptionCount > 0) {
    res.status(400).json({ success: false, message: "This code has already been redeemed and can't be deleted - deactivate it instead to preserve the usage record." });
    return;
  }
  await promoCode.deleteOne();
  res.status(200).json({ success: true, message: "Promo code deleted" });
};

// @desc    List every promo code redemption across all codes (admin-wide usage record)
// @route   GET /api/admin/promo-codes/redemptions/all
// @access  Private (admin)
export const listAllRedemptions = async (_req: AuthRequest, res: Response): Promise<void> => {
  const redemptions = await PromoCodeRedemption.find()
    .populate("promoCode", "code discountType discountValue")
    .populate("user", "name email role")
    .populate("booking", "amount schedule createdAt")
    .sort("-createdAt");

  const totalDiscountIssued = redemptions.reduce((sum, r) => sum + r.discountAmount, 0);
  res.status(200).json({ success: true, total: redemptions.length, totalDiscountIssued, redemptions });
};

// ─── User-facing: validate & redeem ────────────────────────────────────────

// @desc    Validate a promo code against a booking amount and preview the discount
// @route   POST /api/promo-codes/validate
// @access  Private (student, parent)
export const validatePromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, amount } = req.body;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  if (!code || amount === undefined) {
    res.status(400).json({ success: false, message: "Code and booking amount are required" });
    return;
  }

  const promoCode = await PromoCode.findOne({ code: String(code).trim().toUpperCase() });
  if (!promoCode) {
    res.status(404).json({ success: false, message: "Invalid promo code" });
    return;
  }
  if (!promoCode.isActive) {
    res.status(400).json({ success: false, message: "This promo code is no longer active" });
    return;
  }
  const now = new Date();
  if (promoCode.validFrom > now) {
    res.status(400).json({ success: false, message: "This promo code is not active yet" });
    return;
  }
  if (promoCode.validUntil && promoCode.validUntil < now) {
    res.status(400).json({ success: false, message: "This promo code has expired" });
    return;
  }
  if (userRole && !promoCode.applicableRoles.includes(userRole as "student" | "parent")) {
    res.status(400).json({ success: false, message: "This promo code isn't valid for your account type" });
    return;
  }
  if (amount < promoCode.minBookingAmount) {
    res.status(400).json({ success: false, message: `This code requires a minimum booking amount of ${promoCode.minBookingAmount}` });
    return;
  }
  if (promoCode.maxRedemptions && promoCode.redemptionCount >= promoCode.maxRedemptions) {
    res.status(400).json({ success: false, message: "This promo code has reached its redemption limit" });
    return;
  }
  const userRedemptions = await PromoCodeRedemption.countDocuments({ promoCode: promoCode._id, user: userId, status: { $ne: "cancelled" } });
  if (userRedemptions >= promoCode.maxRedemptionsPerUser) {
    res.status(400).json({ success: false, message: "You've already used this promo code the maximum number of times" });
    return;
  }

  const discountAmount = computeDiscount(promoCode, amount);
  res.status(200).json({
    success: true,
    valid: true,
    discountAmount,
    finalAmount: Math.round((amount - discountAmount) * 100) / 100,
    promoCode: { code: promoCode.code, description: promoCode.description, discountType: promoCode.discountType, discountValue: promoCode.discountValue },
  });
};

// @desc    Redeem a promo code against a specific booking, recording the usage record
// @route   POST /api/promo-codes/redeem
// @access  Private (student, parent)
export const redeemPromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, amount, bookingId } = req.body;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  if (!code || amount === undefined) {
    res.status(400).json({ success: false, message: "Code and booking amount are required" });
    return;
  }

  const promoCode = await PromoCode.findOne({ code: String(code).trim().toUpperCase() });
  if (!promoCode) {
    res.status(404).json({ success: false, message: "Invalid promo code" });
    return;
  }
  if (!promoCode.isActive) {
    res.status(400).json({ success: false, message: "This promo code is no longer active" });
    return;
  }
  const now = new Date();
  if (promoCode.validFrom > now || (promoCode.validUntil && promoCode.validUntil < now)) {
    res.status(400).json({ success: false, message: "This promo code is not currently valid" });
    return;
  }
  if (userRole && !promoCode.applicableRoles.includes(userRole as "student" | "parent")) {
    res.status(400).json({ success: false, message: "This promo code isn't valid for your account type" });
    return;
  }
  if (amount < promoCode.minBookingAmount) {
    res.status(400).json({ success: false, message: `This code requires a minimum booking amount of ${promoCode.minBookingAmount}` });
    return;
  }
  if (promoCode.maxRedemptions && promoCode.redemptionCount >= promoCode.maxRedemptions) {
    res.status(400).json({ success: false, message: "This promo code has reached its redemption limit" });
    return;
  }
  const userRedemptions = await PromoCodeRedemption.countDocuments({ promoCode: promoCode._id, user: userId, status: { $ne: "cancelled" } });
  if (userRedemptions >= promoCode.maxRedemptionsPerUser) {
    res.status(400).json({ success: false, message: "You've already used this promo code the maximum number of times" });
    return;
  }

  const discountAmount = computeDiscount(promoCode, amount);
  const finalAmount = Math.round((amount - discountAmount) * 100) / 100;

  const redemption = await PromoCodeRedemption.create({
    promoCode: promoCode._id,
    user: userId,
    booking: bookingId || undefined,
    originalAmount: amount,
    discountAmount,
    finalAmount,
    status: "applied",
  });

  promoCode.redemptionCount += 1;
  await promoCode.save();

  res.status(200).json({ success: true, discountAmount, finalAmount, redemption });
};
