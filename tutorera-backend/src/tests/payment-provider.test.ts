import { paymentProvider } from "../services/paymentProvider.service";

describe("Rapid Gateway", () => {
  it("creates a checkout for a non-PKR currency instead of rejecting it (single-gateway consolidation)", async () => {
    // No SAFEPAY_WORKER_URL is set in the test environment, so createCheckout
    // falls back to the sandbox mock URL. With only one gateway left, every
    // currency routes through it - this used to be a market guard that
    // rejected non-PKR checkouts outright when a second (Stripe) gateway
    // existed to handle them; that branch no longer exists.
    const checkoutUrl = await paymentProvider.createCheckout({
      amount: 100,
      currency: "AED",
      customerMobileNo: "+971500000000",
      customerEmail: "student@example.test",
      basketId: "market-guard-test",
      description: "Test checkout",
      successUrl: "https://example.test/success",
      failureUrl: "https://example.test/failure",
      checkoutUrl: "https://example.test/checkout",
    });

    expect(checkoutUrl).toContain("reference=market-guard-test");
  });
});
