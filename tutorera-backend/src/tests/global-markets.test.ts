import { afterEach, beforeEach } from "@jest/globals";
import MarketConfig from "../models/MarketConfig.model";
import { assertAcceptanceAvailable, ensureLaunchMarkets } from "../services/market.service";

describe("global market capability enforcement", () => {
  beforeEach(() => {
    process.env.SWICH_SUPPORTED_MARKETS = "PK,AE,GB,US,SA,IN";
    process.env.SWICH_SUPPORTED_CURRENCIES = "USD";
  });

  afterEach(() => {
    delete process.env.SWICH_SUPPORTED_MARKETS;
    delete process.env.SWICH_SUPPORTED_CURRENCIES;
  });

  it("keeps every approved launch market transactional in USD", async () => {
    await ensureLaunchMarkets();
    const markets = await MarketConfig.find().sort("countryCode").lean();
    expect(markets.map((market) => market.countryCode)).toEqual(["AE", "GB", "IN", "PK", "SA", "US"]);
    expect(markets.every((market) => market.paymentsEnabled && market.paymentProvider === "swich" && market.currency === "USD" && market.launchStatus === "live")).toBe(true);
  });

  it("permits acceptance in every approved launch market", async () => {
    await ensureLaunchMarkets();
    for (const countryCode of ["PK", "AE", "GB", "US", "SA", "IN"]) {
      await expect(assertAcceptanceAvailable(countryCode)).resolves.toMatchObject({ countryCode, paymentProvider: "swich", currency: "USD" });
    }
  });

  it("enables a non-PK market only when Switch explicitly approves its market and currency", async () => {
    const previousMarkets = process.env.SWICH_SUPPORTED_MARKETS;
    const previousCurrencies = process.env.SWICH_SUPPORTED_CURRENCIES;
    process.env.SWICH_SUPPORTED_MARKETS = "PK,AE";
    process.env.SWICH_SUPPORTED_CURRENCIES = "USD";
    try {
      await ensureLaunchMarkets();
      await expect(assertAcceptanceAvailable("AE")).resolves.toMatchObject({
        countryCode: "AE",
        paymentProvider: "swich",
        currency: "USD",
      });
    } finally {
      if (previousMarkets === undefined) delete process.env.SWICH_SUPPORTED_MARKETS;
      else process.env.SWICH_SUPPORTED_MARKETS = previousMarkets;
      if (previousCurrencies === undefined) delete process.env.SWICH_SUPPORTED_CURRENCIES;
      else process.env.SWICH_SUPPORTED_CURRENCIES = previousCurrencies;
      await ensureLaunchMarkets();
    }
  });
});
