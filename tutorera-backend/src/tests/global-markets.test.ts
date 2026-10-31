import { afterEach, beforeEach } from "@jest/globals";
import MarketConfig from "../models/MarketConfig.model";
import { assertAcceptanceAvailable, ensureLaunchMarkets } from "../services/market.service";

describe("global market capability enforcement", () => {
  beforeEach(() => {
    process.env.RAPIDPAY_SUPPORTED_MARKETS = "PK,AE,GB,US,SA,IN";
  });

  afterEach(() => {
    delete process.env.RAPIDPAY_SUPPORTED_MARKETS;
  });

  it("keeps every approved launch market transactional in USD", async () => {
    await ensureLaunchMarkets();
    const markets = await MarketConfig.find().sort("countryCode").lean();
    expect(markets.map((market) => market.countryCode)).toEqual(["AE", "GB", "IN", "PK", "SA", "US"]);
    expect(markets.every((market) => market.paymentsEnabled && market.paymentProvider === "rapidpay" && market.currency === "USD" && market.launchStatus === "live")).toBe(true);
  });

  it("permits acceptance in every approved launch market", async () => {
    await ensureLaunchMarkets();
    for (const countryCode of ["PK", "AE", "GB", "US", "SA", "IN"]) {
      await expect(assertAcceptanceAvailable(countryCode)).resolves.toMatchObject({ countryCode, paymentProvider: "rapidpay", currency: "USD" });
    }
  });

  it("enables a non-PK market only when RapidPay explicitly approves its market", async () => {
    const previous = process.env.RAPIDPAY_SUPPORTED_MARKETS;
    process.env.RAPIDPAY_SUPPORTED_MARKETS = "PK,AE";
    try {
      await ensureLaunchMarkets();
      await expect(assertAcceptanceAvailable("AE")).resolves.toMatchObject({
        countryCode: "AE",
        paymentProvider: "rapidpay",
        currency: "USD",
      });
    } finally {
      if (previous === undefined) delete process.env.RAPIDPAY_SUPPORTED_MARKETS;
      else process.env.RAPIDPAY_SUPPORTED_MARKETS = previous;
      await ensureLaunchMarkets();
    }
  });
});
