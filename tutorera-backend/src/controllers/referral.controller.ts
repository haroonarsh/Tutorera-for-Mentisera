import { Response } from "express";
import { AuthRequest } from "../types";
import User from "../models/User.model";
import Referral from "../models/Referral.model";
import Booking from "../models/Booking.model";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";

const REFERRAL_CREDIT_PKR = 200;
const REFERRED_DISCOUNT_PKR = 200;

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
  const creditedCount   = referrals.filter(r => r.status === "credited").length;
  const pendingCount    = referrals.filter(r => r.status === "pending").length;
  const totalEarned     = creditedCount * REFERRAL_CREDIT_PKR;

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

  // Link the referral
  currentUser.referredBy = referrer._id;
  currentUser.referralCredit = (currentUser.referralCredit || 0) + REFERRED_DISCOUNT_PKR;
  await currentUser.save();

  // Create referral record
  await Referral.create({
    referrer: referrer._id,
    referred: currentUser._id,
    status: "pending",
    creditAmount: REFERRAL_CREDIT_PKR,
  });

  // Notify referrer
  await sendEmail({
    to: referrer.email,
    subject: "🎉 Someone used your TUTORERA® referral code!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your referral link worked! 🎉</h2>
        <p><strong>${currentUser.name}</strong> just signed up using your referral code.</p>
        <p>You'll receive <strong>Rs. ${REFERRAL_CREDIT_PKR} credit</strong> once they complete their first booking.</p>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Referral Program</p>
      </div>
    `,
  });

  res.status(200).json({
    success: true,
    message: `Referral code applied! You've received Rs. ${REFERRED_DISCOUNT_PKR} credit to use on your first booking.`,
    creditAdded: REFERRED_DISCOUNT_PKR,
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

    // Credit the referrer
    await User.findByIdAndUpdate(user.referredBy, {
      $inc: { referralCredit: REFERRAL_CREDIT_PKR },
    });

    // Mark referral as credited
    referral.status = "credited";
    await referral.save();

    // Email referrer
    const referrer = await User.findById(user.referredBy);
    if (referrer) {
      await sendEmail({
        to: referrer.email,
        subject: "💰 You earned Rs. 200 referral credit — TUTORERA®",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Rs. ${REFERRAL_CREDIT_PKR} credit added! 💰</h2>
            <p>Your referral <strong>${user.name}</strong> just completed their first booking.</p>
            <p>We've added <strong>Rs. ${REFERRAL_CREDIT_PKR}</strong> to your TUTORERA® credit balance.</p>
            <p>Your total credit balance: <strong>Rs. ${(referrer.referralCredit || 0) + REFERRAL_CREDIT_PKR}</strong></p>
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