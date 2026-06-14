// Platform fee configuration
export const PLATFORM_FEE_PERCENT = 30;
export const GST_PERCENT = 15;
export const GST_ON_FEE = (PLATFORM_FEE_PERCENT * GST_PERCENT) / 100; // 4.5%
export const TOTAL_FEE_PERCENT = PLATFORM_FEE_PERCENT + GST_ON_FEE; // 34.5%

// Subscription plans
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    bidsPerMonth: 3,
    requestsPerMonth: 2,
  },
  standard: {
    name: "Standard",
    price: 500,
    bidsPerMonth: 10,
    requestsPerMonth: 10,
  },
  premium: {
    name: "Premium",
    price: 1000,
    bidsPerMonth: -1, // unlimited
    requestsPerMonth: -1, // unlimited
  },
};