import MarketConfig from "../models/MarketConfig.model";
import { assertAcceptanceAvailable, ensureLaunchMarkets } from "../services/market.service";

describe("global market capability enforcement", () => {
  it("seeds Pakistan and UAE as transactional and UK as discovery beta", async () => {
    await ensureLaunchMarkets();
    const markets = await MarketConfig.find().sort("countryCode").lean();
    // AE, IN, SA, US were added to LAUNCH_MARKETS after this test was
    // written; PK/AE/US/SA/IN all launch "live" with payments enabled, GB
    // remains a discovery-only beta market.
    expect(markets.map((market) => market.countryCode)).toEqual(["AE", "GB", "IN", "PK", "SA", "US"]);
    expect(markets.find((market) => market.countryCode === "PK")?.paymentsEnabled).toBe(true);
    // AE was unlocked for payments earlier this session - it's now live and
    // transactional like PK, not discovery-only.
    expect(markets.find((market) => market.countryCode === "AE")?.paymentsEnabled).toBe(true);
    expect(markets.find((market) => market.countryCode === "AE")?.launchStatus).toBe("live");
    expect(markets.find((market) => market.countryCode === "GB")?.paymentsEnabled).toBe(false);
    expect(markets.find((market) => market.countryCode === "GB")?.launchStatus).toBe("beta");
  });

  it("permits PK/AE acceptance and blocks discovery-beta acceptance", async () => {
    await ensureLaunchMarkets();
    await expect(assertAcceptanceAvailable("PK")).resolves.toMatchObject({ countryCode: "PK", paymentProvider: "rapidpay" });
    await expect(assertAcceptanceAvailable("AE")).resolves.toMatchObject({ countryCode: "AE", paymentProvider: "rapidpay" });
    await expect(assertAcceptanceAvailable("GB")).rejects.toMatchObject({ code: "MARKET_DISCOVERY_ONLY", statusCode: 409 });
  });
});
