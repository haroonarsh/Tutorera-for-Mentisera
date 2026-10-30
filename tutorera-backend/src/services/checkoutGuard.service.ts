import { randomUUID } from "crypto";
import CheckoutGuard from "../models/CheckoutGuard.model";
import { httpError } from "../utils/httpError";

export async function withCheckoutGuard<T>(basketId: string, work: (markDispatched: () => void) => Promise<T>): Promise<T> {
  const owner = randomUUID();
  try {
    await CheckoutGuard.findOneAndUpdate(
      { _id: basketId, state: "idle" },
      { $set: { state: "creating", owner } },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw httpError("A payment attempt is already in progress or requires review. Contact support if it does not resolve.", 409, "PAYMENT_ATTEMPT_BLOCKED");
    throw error;
  }
  let dispatched = false;
  try {
    const result = await work(() => { dispatched = true; });
    const updated = await CheckoutGuard.updateOne({ _id: basketId, state: "creating", owner }, { $set: { state: "idle" } });
    if (!updated.matchedCount) throw new Error("Checkout guard ownership changed");
    return result;
  } catch (error) {
    // Before dispatch there is no new external payment session. Once a request
    // leaves the process, an error/timeout is ambiguous and must not auto-retry.
    await CheckoutGuard.updateOne({ _id: basketId, state: "creating", owner }, { $set: { state: dispatched ? "uncertain" : "idle" } }).catch(() => undefined);
    if (dispatched) throw httpError("The payment attempt needs review before another checkout can be started. Contact support.", 503, "PAYMENT_OUTCOME_UNKNOWN");
    throw error;
  }
}
