import rateLimit from "express-rate-limit";

// General API-wide limiter — generous, just to stop obvious abuse/scraping
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." },
});

// Strict limiter for login — prevent brute-force password guessing
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only count failed attempts
    message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
});

// Registration — prevent mass fake account creation
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many accounts created from this location. Please try again later." },
});

// Forgot-password / OTP — prevent email-bombing and brute-forcing the 6-digit code
export const otpRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many code requests. Please wait before requesting another." },
});

export const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts. Please request a new code." },
});

// Contact / support forms — prevent spam
export const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many messages sent. Please try again later." },
});

// AI chat — prevent runaway API costs
export const aiChatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "You're sending messages too quickly. Please slow down." },
});

// File uploads — prevent storage/bandwidth abuse
export const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many uploads. Please try again later." },
});

// Google auth — same brute-force concern as regular login
export const googleAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts. Please try again later." },
});

// Public token-based tracking lookup — cap to prevent enumeration/scraping
export const trackingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many tracking lookups. Please try again later." },
});

// Tutor-initiated token rotation — strict, defend against stolen sessions
export const tutorRotateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "You can only rotate your tracking link a few times per hour." },
});

// TEMPORARY: test email endpoint — keep abuse bounded but allow easy
// triggering for design QA. Remove with the /admin/test-email route.
export const publicTestEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many test emails sent from this address. Please try again later." },
});