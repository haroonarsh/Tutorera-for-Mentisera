import { Response } from "express";
import { AuthRequest } from "../types";
import User from "../models/User.model";
import Referral from "../models/Referral.model";
import Booking from "../models/Booking.model";
import ReferralConfig from "../models/ReferralConfig.model";
import sendEmail from "../utils/sendEmail";
import { formatCurrencyAmount, SUPPORTED_CURRENCIES } from "../config/countries";
import crypto from "crypto";

// Defaults used until an admin saves a ReferralConfig document (or if the
// config is later deleted) - keeps the reward amounts working out of the box
// while still being adjustable from /admin/referral-config without a deploy.
// Amounts are denominated in the config currency, which defaults to the global
// settlement currency (USD) rather than assuming a Pakistan market.
const DEFAULT_REFERRAL_CREDIT_AMOUNT = 200;
const DEFAULT_REFERRED_DISCOUNT_AMOUNT = 200;
const DEFAULT_REFERRAL_CURRENCY = "USD";

async function getReferralConfig(): Promise<{ referrerRewardAmount: number; referredDiscountAmount: number; currency: string; isActive: boolean }> {
  const config = await ReferralConfig.findOne();
  if (!config) return { referrerRewardAmount: DEFAULT_REFERRAL_CREDIT_AMOUNT, referredDiscountAmount: DEFAULT_REFERRED_DISCOUNT_AMOUNT, currency: DEFAULT_REFERRAL_CURRENCY, isActive: true };
  return {
    referrerRewardAmount: config.referrerRewardAmount,
    referredDiscountAmount: config.referredDiscountAmount,
    currency: config.currency || DEFAULT_REFERRAL_CURRENCY,
    isActive: config.isActive,
  };
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
    referralCreditCurrency: user.referralCreditCurrency || DEFAULT_REFERRAL_CURRENCY,
    program: await getReferralConfig(),
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

  const { referrerRewardAmount, referredDiscountAmount, currency, isActive } = await getReferralConfig();
  if (!isActive) {
    res.status(400).json({ success: false, message: "The referral program is currently paused." });
    return;
  }

  // A user carries one referral balance. Crediting a new currency into a
  // balance that already holds a different one would silently mix units, so an
  // established balance currency stays authoritative and the new reward is
  // rejected rather than merged. A zero balance adopts the config currency.
  const hasBalance = (currentUser.referralCredit || 0) > 0;
  const balanceCurrency = hasBalance ? (currentUser.referralCreditCurrency || DEFAULT_REFERRAL_CURRENCY) : currency;
  if (hasBalance && balanceCurrency !== currency) {
    res.status(400).json({
      success: false,
      message: `Your referral credit balance is held in ${balanceCurrency} and cannot also receive a ${currency} reward.`,
    });
    return;
  }

  // Link the referral
  currentUser.referredBy = referrer._id;
  currentUser.referralCredit = (currentUser.referralCredit || 0) + referredDiscountAmount;
  currentUser.referralCreditCurrency = balanceCurrency;
  await currentUser.save();

  // Create referral record
  await Referral.create({
    referrer: referrer._id,
    referred: currentUser._id,
    status: "pending",
    creditAmount: referrerRewardAmount,
    creditCurrency: currency,
  });

  // Notify referrer
  await sendEmail({
    to: referrer.email,
    subject: "🎉 Someone used your TUTORERA® referral code!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your referral link worked! 🎉</h2>
        <p><strong>${currentUser.name}</strong> just signed up using your referral code.</p>
        <p>You'll receive <strong>${formatCurrencyAmount(referrerRewardAmount, currency)} credit</strong> once they complete their first booking.</p>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Referral Program</p>
      </div>
    `,
  });

  res.status(200).json({
    success: true,
    message: `Referral code applied! You've received ${formatCurrencyAmount(referredDiscountAmount, balanceCurrency)} credit to use on your first booking.`,
    creditAdded: referredDiscountAmount,
    creditCurrency: balanceCurrency,
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
    const creditCurrency = referral.creditCurrency || DEFAULT_REFERRAL_CURRENCY;
    await User.findByIdAndUpdate(user.referredBy, {
      $inc: { referralCredit: creditAmount },
      $set: { referralCreditCurrency: creditCurrency },
    });

    // Mark referral as credited
    referral.status = "credited";
    await referral.save();

    // Email referrer
    const referrer = await User.findById(user.referredBy);
    if (referrer) {
      await sendEmail({
        to: referrer.email,
        subject: `💰 You earned ${formatCurrencyAmount(creditAmount, creditCurrency)} referral credit — TUTORERA®`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">${formatCurrencyAmount(creditAmount, creditCurrency)} credit added! 💰</h2>
            <p>Your referral <strong>${user.name}</strong> just completed their first booking.</p>
            <p>We've added <strong>${formatCurrencyAmount(creditAmount, creditCurrency)}</strong> to your TUTORERA® credit balance.</p>
            <p>Your total credit balance: <strong>${formatCurrencyAmount((referrer.referralCredit || 0) + creditAmount, creditCurrency)}</strong></p>
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

  // Credits are issued in the config currency, but a currency change never
  // rewrites history: totals are grouped per currency so PKR and USD rewards
  // are never summed into one meaningless number.
  const creditedByCurrency = referrals
    .filter(r => r.status === "credited")
    .reduce((grouped, r) => {
      const currency = r.creditCurrency || DEFAULT_REFERRAL_CURRENCY;
      grouped[currency] = (grouped[currency] || 0) + (r.creditAmount || 0);
      return grouped;
    }, {} as Record<string, number>);

  const creditByCurrency = Object.entries(creditedByCurrency).map(([currency, total]) => ({ currency, total }));

  res.status(200).json({
    success: true,
    total: referrals.length,
    totalCreditIssued: creditByCurrency.length === 1 ? creditByCurrency[0].total : null,
    creditByCurrency,
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
  const { referrerRewardAmount, referredDiscountAmount, currency, isActive } = req.body;

  let config = await ReferralConfig.findOne();
  if (!config) config = new ReferralConfig({});

  if (currency !== undefined) {
    const code = String(currency).trim().toUpperCase();
    if (!SUPPORTED_CURRENCIES[code]) {
      res.status(400).json({ success: false, message: `Unsupported currency: ${code}` });
      return;
    }
    config.currency = code;
  }

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