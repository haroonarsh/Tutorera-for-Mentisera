// src/config/env.ts
// Validates required environment variables at startup. If anything required
// is missing, the process exits immediately with a clear message instead of
// starting in a broken state and failing confusingly later.

interface RequiredEnvVar {
    key: string;
    validate?: (value: string) => string | null;
}

const REQUIRED_ENV_VARS: RequiredEnvVar[] = [
    { key: "MONGO_URI" },
    {
        key: "JWT_SECRET",
        validate: (v) => (v.length < 16 ? "must be at least 16 characters" : null),
    },
    { key: "PORT" },
    { key: "JWT_EXPIRES_IN" },
    { key: "CLIENT_URL" },
    { key: "RESEND_API_KEY" },
    { key: "CLOUDINARY_CLOUD_NAME" },
    { key: "CLOUDINARY_API_KEY" },
    { key: "CLOUDINARY_API_SECRET" },
    { key: "EMAIL_USER" },
    { key: "EMAIL_PASS" },
    { key: "RESEND" },
    { key: "GROQ_API_KEY" },
    { key: "GOOGLE_CLIENT_ID" },
    { key: "GOOGLE_CLIENT_SECRET" },
    {
    key: "SWICH_CLIENT_ID",
    },
    {
        key: "SWICH_CLIENT_SECRET",
        validate: (v) => (v.length < 12 ? "appears too short for a client secret" : null),
    },
];

export function validateEnv(): void {
    const errors: string[] = [];

    for (const { key, validate } of REQUIRED_ENV_VARS) {
        const value = process.env[key];

        if (!value || value.trim() === "") {
            errors.push(`  - ${key} is missing`);
            continue;
        }

        if (validate) {
            const validationError = validate(value);
            if (validationError) {
                errors.push(`  - ${key} is invalid: ${validationError}`);
            }
        }
    }

    // Payment and webhook configuration must fail closed in production. The
    // non-production sandbox defaults deliberately remain available for the
    // isolated provider tests, but production must never silently use them.
    if (process.env.NODE_ENV === "production") {
        for (const key of ["SWICH_AUTH_BASE_URL", "SWICH_API_BASE_URL", "SWICH_CALLBACK_URL", "SWICH_CALLBACK_SECRET", "RESEND_WEBHOOK_SECRET"]) {
            if (!process.env[key]?.trim()) errors.push(`  - ${key} is required in production`);
        }
        for (const key of ["SWICH_AUTH_BASE_URL", "SWICH_API_BASE_URL", "SWICH_CALLBACK_URL"]) {
            const value = process.env[key]?.trim();
            if (value && (!value.startsWith("https://") || /sandbox/i.test(value))) {
                errors.push(`  - ${key} must be a non-sandbox HTTPS endpoint in production`);
            }
        }
        const checkoutMode = (process.env.SWICH_CHECKOUT_MODE || "session").trim().toLowerCase();
        if (!["session", "pwa"].includes(checkoutMode)) errors.push("  - SWICH_CHECKOUT_MODE must be session or pwa");
        if (checkoutMode === "pwa" && !process.env.SWICH_PWA_BASE_URL?.trim()) errors.push("  - SWICH_PWA_BASE_URL is required for PWA checkout");
        const swichMode = (process.env.SWICH_MODE || process.env.SWICH_ENV || process.env.SWICH_ENVIRONMENT || "live").trim().toLowerCase();
        if (swichMode === "sandbox") {
            errors.push("  - SWICH_MODE cannot be set to sandbox in production");
        }
    }

    if (errors.length > 0) {
        console.error("Environment validation failed:\n" + errors.join("\n"));
        console.error("\nFix the environment variables before starting the server.");
        process.exit(1);
    }

    console.log("Environment variables validated");
}
