import User from "../models/User.model";
import { AccountStatus } from "../types";

export async function setAccountStatus(userId: string, status: AccountStatus): Promise<void> {
  await User.findByIdAndUpdate(userId, { accountStatus: status });
}

export async function advanceAccountStatus(userId: string, target: AccountStatus): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const order = ["registered", "onboarding", "profile_complete", "submitted", "verified", "rejected"];
  const currentIdx = order.indexOf(user.accountStatus || "registered");
  const targetIdx = order.indexOf(target);

  if (targetIdx <= currentIdx) return;

  const next = order[currentIdx + 1];
  if (next === target || (target === "rejected" && next === "submitted")) {
    await User.findByIdAndUpdate(userId, { accountStatus: target });
  } else {
    await User.findByIdAndUpdate(userId, { accountStatus: next });
  }
}

export function canTransitionTo(current: AccountStatus | undefined, target: AccountStatus): boolean {
  const order = ["registered", "onboarding", "profile_complete", "submitted", "verified", "rejected"];
  const currentIdx = order.indexOf(current || "registered");
  const targetIdx = order.indexOf(target);
  return targetIdx > currentIdx;
}
