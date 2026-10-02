import { assertSwichRuntimeConfiguration } from "../services/swichProvider.service";

describe("Switch production runtime configuration", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects an implicit sandbox configuration in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.SWICH_AUTH_BASE_URL;
    delete process.env.SWICH_API_BASE_URL;

    expect(() => assertSwichRuntimeConfiguration()).toThrow("SWICH_AUTH_BASE_URL must be configured");
  });

  it("rejects an explicitly configured sandbox host in production", () => {
    process.env.NODE_ENV = "production";
    process.env.SWICH_AUTH_BASE_URL = "https://sandbox-auth.swichnow.com";
    process.env.SWICH_API_BASE_URL = "https://sandbox-api.swichnow.com";

    expect(() => assertSwichRuntimeConfiguration()).toThrow("SWICH_AUTH_BASE_URL must be a non-sandbox HTTPS endpoint");
  });

  it("rejects explicitly configured sandbox mode in production", () => {
    process.env.NODE_ENV = "production";
    process.env.SWICH_MODE = "sandbox";
    process.env.SWICH_CLIENT_ID = "client_prod_id";
    process.env.SWICH_CLIENT_SECRET = "client_prod_secret";
    process.env.SWICH_AUTH_BASE_URL = "https://auth.payments.example";
    process.env.SWICH_API_BASE_URL = "https://api.payments.example";

    expect(() => assertSwichRuntimeConfiguration()).toThrow("SWICH_MODE cannot be set to sandbox");
  });

  it("rejects missing credentials in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.SWICH_CLIENT_ID;
    process.env.SWICH_AUTH_BASE_URL = "https://auth.payments.example";
    process.env.SWICH_API_BASE_URL = "https://api.payments.example";

    expect(() => assertSwichRuntimeConfiguration()).toThrow("SWICH_CLIENT_ID is not configured");
  });

  it("accepts explicit HTTPS production hosts and credentials", () => {
    process.env.NODE_ENV = "production";
    process.env.SWICH_MODE = "live";
    process.env.SWICH_CLIENT_ID = "client_prod_id";
    process.env.SWICH_CLIENT_SECRET = "client_prod_secret";
    process.env.SWICH_AUTH_BASE_URL = "https://auth.payments.example";
    process.env.SWICH_API_BASE_URL = "https://api.payments.example";

    expect(() => assertSwichRuntimeConfiguration()).not.toThrow();
  });
});
