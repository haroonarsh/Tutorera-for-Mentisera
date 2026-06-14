import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import User from "../models/User.model";
import { PLANS } from "../config/constants";

export const checkBidLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  const plan = (user as any).plan || "free";
  const planConfig = PLANS[plan as keyof typeof PLANS];

  // Check if bids need to reset (new month)
  const resetDate = (user as any).bidsResetDate;
  const now = new Date();
  if (resetDate && new Date(resetDate).getMonth() !== now.getMonth()) {
    await User.findByIdAndUpdate(user._id, {
      bidsThisMonth: 0,
      bidsResetDate: now,
    });
    (user as any).bidsThisMonth = 0;
  }

  // -1 means unlimited
  if (planConfig.bidsPerMonth === -1) {
    next();
    return;
  }

  const bidsUsed = (user as any).bidsThisMonth || 0;

  if (bidsUsed >= planConfig.bidsPerMonth) {
    res.status(403).json({
      success: false,
      message: `You have reached your bid limit of ${planConfig.bidsPerMonth} bids/month on the ${plan} plan. Upgrade to place more bids.`,
      upgradeRequired: true,
      currentPlan: plan,
      bidsUsed,
      bidsLimit: planConfig.bidsPerMonth,
    });
    return;
  }

  next();
};

// Increment bid count after successful bid
export const incrementBidCount = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $inc: { bidsThisMonth: 1 },
  });
};