import { paymentProvider } from "../services/paymentProvider.service";

describe("Rapid Gateway market guard", () => {
  it("does not silently process a non-PKR checkout as PKR", async () => {
    await expect(paymentProvider.createCheckout({
      amount: 100,
      currency: "AED",
      customerMobileNo: "+971500000000",
      customerEmail: "student@example.test",
      basketId: "market-guard-test",
      description: "Test checkout",
      successUrl: "https://example.test/success",
      failureUrl: "https://example.test/failure",
      checkoutUrl: "https://example.test/checkout",
    })).rejects.toMatchObject({ statusCode: 409 });
  });
});
