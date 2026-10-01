import MarketConfig from "../models/MarketConfig.model";
import { assertAcceptanceAvailable, ensureLaunchMarkets } from "../services/market.service";

describe("global market capability enforcement", () => {
  it("keeps Pakistan transactional and all unconfigured markets non-transactional", async () => {
    await ensureLaunchMarkets();
    const markets = await MarketConfig.find().sort("countryCode").lean();
    expect(markets.map((market) => market.countryCode)).toEqual(["AE", "GB", "IN", "PK", "SA", "US"]);
    expect(markets.find((market) => market.countryCode === "PK")?.paymentsEnabled).toBe(true);
    expect(markets.find((market) => market.countryCode === "PK")?.paymentProvider).toBe("swich");
    expect(markets.find((market) => market.countryCode === "AE")?.paymentsEnabled).toBe(false);
    expect(markets.find((market) => market.countryCode === "AE")?.launchStatus).toBe("beta");
    expect(markets.find((market) => market.countryCode === "GB")?.paymentsEnabled).toBe(false);
    expect(markets.find((market) => market.countryCode === "GB")?.launchStatus).toBe("beta");
  });

  it("permits PK acceptance and blocks every discovery or disabled market", async () => {
    await ensureLaunchMarkets();
    await expect(assertAcceptanceAvailable("PK")).resolves.toMatchObject({ countryCode: "PK", paymentProvider: "swich" });
    await expect(assertAcceptanceAvailable("AE")).rejects.toMatchObject({ code: "MARKET_DISCOVERY_ONLY", statusCode: 409 });
    await expect(assertAcceptanceAvailable("GB")).rejects.toMatchObject({ code: "MARKET_DISCOVERY_ONLY", statusCode: 409 });
  });
});
