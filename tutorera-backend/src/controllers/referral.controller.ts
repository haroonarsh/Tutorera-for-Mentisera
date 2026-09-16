import { Response } from "express";
import { AuthRequest } from "../types";
import User from "../models/User.model";
import Referral from "../models/Referral.model";
import Booking from "../models/Booking.model";
import ReferralConfig from "../models/ReferralConfig.model";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";

// Defaults used until an admin saves a ReferralConfig document (or if the
// config is later deleted) - keeps the reward amounts working out of the box
// while still being adjustable from /admin/referral-config without a deploy.
const DEFAULT_REFERRAL_CREDIT_PKR = 200;
const DEFAULT_REFERRED_DISCOUNT_PKR = 200;

async function getReferralConfig(): Promise<{ referrerRewardAmount: number; referredDiscountAmount: number; isActive: boolean }> {
  const config = await ReferralConfig.findOne();
  if (!config) return { referrerRewardAmount: DEFAULT_REFERRAL_CREDIT_PKR, referredDiscountAmount: DEFAULT_REFERRED_DISCOUNT_PKR, isActive: true };
  return { referrerRewardAmount: config.referrerRewardAmount, referredDiscountAmount: config.referredDiscountAmount, isActive: config.isActive };
}

// Generate a unique referral code
function generateReferralCode(name: string): string {
  const base = name.replace(/\s+/g, "").toUpperCase().slice(0, 5);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${base}${random}`;
}

// @desc    Get my referral info (code + stats + credit balance)
// @route   GET /api/referral/my
// @access  Private
export const getMyReferral = async (req: AuthRequest, res: Response): Promise<void> => {
  let user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  // Auto-generate referral code if not set yet
  if (!user.referralCode) {
    user.referralCode = generateReferralCode(user.name);
    await user.save();
  }

  const referrals = await Referral.find({ referrer: user._id })
    .populate("referred", "name createdAt")
    .sort("-createdAt");

  const totalReferred   = referrals.length;
  const creditedReferrals = referrals.filter(r => r.status === "credited");
  const creditedCount   = creditedReferrals.length;
  const pendingCount    = referrals.filter(r => r.status === "pending").length;
  // Sum each referral's own recorded creditAmount rather than the current
  // config value, since the reward may have changed since older referrals
  // were credited - this keeps historical totals accurate.
  const totalEarned     = creditedReferrals.reduce((sum, r) => sum + r.creditAmount, 0);

  res.status(200).json({
    success: true,
    referralCode: user.referralCode,
    referralLink: `${process.env.CLIENT_URL}/register?ref=${user.referralCode}`,
    referralCredit: user.referralCredit,
    stats: { totalReferred, creditedCount, pendingCount, totalEarned },
    referrals,
  });
};

// @desc    Apply referral code during/after registration
// @route   POST /api/referral/apply
// @access  Private (newly registered user)
export const applyReferralCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ success: false, message: "Referral code is required." });
    return;
  }

  // Can't apply a code if already referred
  const currentUser = await User.findById(req.user?._id);
  if (!currentUser) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  if (currentUser.referredBy) {
    res.status(400).json({ success: false, message: "You have already applied a referral code." });
    return;
  }

  // Find referrer
  const referrer = await User.findOne({ referralCode: code.trim().toUpperCase() });
  if (!referrer) {
    res.status(404).json({ success: false, message: "Invalid referral code." });
    return;
  }

  // Can't refer yourself
  if (referrer._id.toString() === req.user?._id?.toString()) {
    res.status(400).json({ success: false, message: "You can't use your own referral code." });
    return;
  }

  const { referrerRewardAmount, referredDiscountAmount, isActive } = await getReferralConfig();
  if (!isActive) {
    res.status(400).json({ success: false, message: "The referral program is currently paused." });
    return;
  }

  // Link the referral
  currentUser.referredBy = referrer._id;
  currentUser.referralCredit = (currentUser.referralCredit || 0) + referredDiscountAmount;
  await currentUser.save();

  // Create referral record
  await Referral.create({
    referrer: referrer._id,
    referred: currentUser._id,
    status: "pending",
    creditAmount: referrerRewardAmount,
  });

  // Notify referrer
  await sendEmail({
    to: referrer.email,
    subject: "🎉 Someone used your TUTORERA® referral code!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your referral link worked! 🎉</h2>
        <p><strong>${currentUser.name}</strong> just signed up using your referral code.</p>
        <p>You'll receive <strong>Rs. ${referrerRewardAmount} credit</strong> once they complete their first booking.</p>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Referral Program</p>
      </div>
    `,
  });

  res.status(200).json({
    success: true,
    message: `Referral code applied! You've received Rs. ${referredDiscountAmount} credit to use on your first booking.`,
    creditAdded: referredDiscountAmount,
  });
};

// @desc    Credit referrer when referred user completes first booking
//          Called internally from booking completion flow
export const creditReferrerOnFirstBooking = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user?.referredBy) return;

    // Check if this user's referral has already been credited
    const referral = await Referral.findOne({
      referred: userId,
      status: "pending",
    });
    if (!referral) return;

    // Credit the referrer with the amount locked in when this referral was
    // created (not the current config value, in case it has since changed).
    const creditAmount = referral.creditAmount;
    await User.findByIdAndUpdate(user.referredBy, {
      $inc: { referralCredit: creditAmount },
    });

    // Mark referral as credited
    referral.status = "credited";
    await referral.save();

    // Email referrer
    const referrer = await User.findById(user.referredBy);
    if (referrer) {
      await sendEmail({
        to: referrer.email,
        subject: `💰 You earned Rs. ${creditAmount} referral credit — TUTORERA®`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Rs. ${creditAmount} credit added! 💰</h2>
            <p>Your referral <strong>${user.name}</strong> just completed their first booking.</p>
            <p>We've added <strong>Rs. ${creditAmount}</strong> to your TUTORERA® credit balance.</p>
            <p>Your total credit balance: <strong>Rs. ${(referrer.referralCredit || 0) + creditAmount}</strong></p>
            <hr />
            <p style="color: #6b7280; font-size: 0.875rem;">Share your referral link to earn more credit.</p>
            <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Referral Program</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("Error crediting referrer:", err);
  }
};

// @desc    Get all referrals (admin)
// @route   GET /api/admin/referrals
// @access  Private (admin)
export const getAllReferrals = async (req: AuthRequest, res: Response): Promise<void> => {
  const referrals = await Referral.find()
    .populate("referrer", "name email")
    .populate("referred", "name email createdAt")
    .sort("-createdAt");

  const totalCredit = referrals
    .filter(r => r.status === "credited")
    .reduce((sum, r) => sum + r.creditAmount, 0);

  res.status(200).json({
    success: true,
    total: referrals.length,
    totalCreditIssued: totalCredit,
    referrals,
  });
};

// @desc    Get the current referral reward configuration
// @route   GET /api/admin/referral-config
// @access  Private (admin)
export const getReferralConfigAdmin = async (_req: AuthRequest, res: Response): Promise<void> => {
  let config = await ReferralConfig.findOne();
  if (!config) config = await ReferralConfig.create({});
  res.status(200).json({ success: true, config });
};

// @desc    Update the referral reward configuration
// @route   PUT /api/admin/referral-config
// @access  Private (admin)
export const updateReferralConfigAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  const { referrerRewardAmount, referredDiscountAmount, isActive } = req.body;

  let config = await ReferralConfig.findOne();
  if (!config) config = new ReferralConfig({});

  if (referrerRewardAmount !== undefined) {
    if (referrerRewardAmount < 0) {
      res.status(400).json({ success: false, message: "Reward amount can't be negative" });
      return;
    }
    config.referrerRewardAmount = referrerRewardAmount;
  }
  if (referredDiscountAmount !== undefined) {
    if (referredDiscountAmount < 0) {
      res.status(400).json({ success: false, message: "Discount amount can't be negative" });
      return;
    }
    config.referredDiscountAmount = referredDiscountAmount;
  }
  if (isActive !== undefined) config.isActive = isActive;
  config.updatedBy = req.user?._id;

  await config.save();
  res.status(200).json({ success: true, config });
};