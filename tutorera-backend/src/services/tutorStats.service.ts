import TutorProfile from "../models/TutorProfile.model";
import Bid from "../models/Bid.model";
import Request from "../models/Request.model";

export async function computeAndStoreTutorResponseTime(userId: string): Promise<number> {
  const bids = await Bid.find({ tutor: userId, status: { $nin: ["withdrawn", "pending"] } })
    .select("request createdAt")
    .lean();

  if (bids.length === 0) return 0;

  let totalMinutes = 0;
  let count = 0;

  for (const bid of bids) {
    const req = await Request.findById(bid.request).select("createdAt").lean();
    if (req) {
      totalMinutes += (new Date(bid.createdAt).getTime() - new Date(req.createdAt).getTime()) / 60000;
      count++;
    }
  }

  const avgMinutes = count > 0 ? Math.round(totalMinutes / count) : 0;

  await TutorProfile.findOneAndUpdate(
    { user: userId },
    { averageResponseMinutes: avgMinutes, lastActiveAt: new Date() }
  );

  return avgMinutes;
}

export function formatResponseTime(minutes: number): string {
  if (minutes <= 0) return "<1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
