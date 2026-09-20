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
        key: "RAPID_GATEWAY_SECRET_KEY",
        validate: (v) => (v.length < 12 ? "appears too short for a gateway secret" : null),
    },
    {
        key: "RAPID_GATEWAY_WEBHOOK_SECRET",
        validate: (v) => (v.length < 16 ? "must be at least 16 characters" : null),
    },
    {
        key: "RAPID_GATEWAY_WEBHOOK_URL",
        validate: (v) => {
            try {
                const url = new URL(v);
                return url.protocol !== "https:" ? "must use HTTPS" : null;
            } catch {
                return "must be a valid absolute URL";
            }
        },
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

    if (errors.length > 0) {
        console.error("Environment validation failed:\n" + errors.join("\n"));
        console.error("\nFix the environment variables before starting the server.");
        process.exit(1);
    }

    console.log("Environment variables validated");
}
