import { ClientSession } from "mongoose";
import SchoolOffering from "../models/SchoolOffering.model";

/** Historic requests have no catalogue ID and retain their existing behaviour. */
export async function schoolOfferingIsActive(id?: string | null, session?: ClientSession): Promise<boolean> {
  if (!id) return true;
  const query = SchoolOffering.exists({ _id: id, status: "active" });
  if (session) query.session(session);
  return Boolean(await query);
}
export async function assertSchoolOfferingActive(id?: string | null, session?: ClientSession): Promise<void> {
  if (!(await schoolOfferingIsActive(id, session))) throw Object.assign(new Error("This school offering is no longer available."), { statusCode: 409, code: "SCHOOL_OFFERING_UNAVAILABLE" });
}
