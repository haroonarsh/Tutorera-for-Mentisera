import { DEFAULT_MATCHING_CONFIG } from "../config/matchingConfig";
import { matchingConfigUpdateSchema } from "../validators/matchingConfig.validator";

describe("matching configuration validation", () => {
  const validConfig = () => JSON.parse(JSON.stringify(DEFAULT_MATCHING_CONFIG));

  it("accepts the complete default 100-point configuration", () => {
    expect(matchingConfigUpdateSchema.safeParse(validConfig()).success).toBe(true);
  });

  it("rejects weights that do not total 100 points", () => {
    const config = validConfig();
    config.onlineWeights.subject = 25;
    const parsed = matchingConfigUpdateSchema.safeParse(config);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message.includes("exactly 100"))).toBe(true);
    }
  });

  it("rejects unknown configuration keys and unsafe thresholds", () => {
    const config = validConfig();
    config.unexpected = true;
    config.thresholds.maxOffers = 200;
    expect(matchingConfigUpdateSchema.safeParse(config).success).toBe(false);
  });
});
