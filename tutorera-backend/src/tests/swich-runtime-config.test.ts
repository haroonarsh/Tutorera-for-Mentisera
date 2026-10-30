import { assertRapidPayRuntimeConfiguration } from "../services/rapidPayProvider.service";

describe("RapidPay production runtime configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.RAPIDPAY_API_KEY = "test_key_placeholder";
    process.env.RAPIDPAY_MERCHANT_ID = "0000";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts a valid non-sandbox HTTPS production base URL", () => {
    process.env.NODE_ENV = "production";
    process.env.RAPIDPAY_BASE_URL = "https://api.rapidpay.co";

    expect(() => assertRapidPayRuntimeConfiguration()).not.toThrow();
  });

  it("rejects a missing base URL in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.RAPIDPAY_BASE_URL;

    expect(() => assertRapidPayRuntimeConfiguration()).toThrow("RAPIDPAY_BASE_URL must be configured");
  });

  it("rejects an invalid base URL", () => {
    process.env.NODE_ENV = "production";
    process.env.RAPIDPAY_BASE_URL = "not-a-url";

    expect(() => assertRapidPayRuntimeConfiguration()).toThrow("valid HTTPS URL");
  });

  it("rejects an http (non-HTTPS) base URL", () => {
    process.env.NODE_ENV = "production";
    process.env.RAPIDPAY_BASE_URL = "http://api.rapidpay.co";

    expect(() => assertRapidPayRuntimeConfiguration()).toThrow("must be HTTPS");
  });

  it("rejects a missing API key", () => {
    process.env.NODE_ENV = "production";
    process.env.RAPIDPAY_BASE_URL = "https://api.rapidpay.co";
    delete process.env.RAPIDPAY_API_KEY;

    expect(() => assertRapidPayRuntimeConfiguration()).toThrow("RAPIDPAY_API_KEY is not configured");
  });

  it("rejects a missing merchant ID", () => {
    process.env.NODE_ENV = "production";
    process.env.RAPIDPAY_BASE_URL = "https://api.rapidpay.co";
    delete process.env.RAPIDPAY_MERCHANT_ID;

    expect(() => assertRapidPayRuntimeConfiguration()).toThrow("RAPIDPAY_MERCHANT_ID is not configured");
  });

  it("accepts non-production without base URL (sandbox fallback)", () => {
    process.env.NODE_ENV = "development";
    delete process.env.RAPIDPAY_BASE_URL;

    expect(() => assertRapidPayRuntimeConfiguration()).not.toThrow();
  });
});
