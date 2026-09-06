// src/utils/antiCircumvention.ts
// Automated Anti-Circumvention Protection for TUTORERA

export interface CircumventionScanResult {
  detected: boolean;
  score: number; // 0 to 100 risk score
  categories: string[];
  snippet?: string;
  matchedPattern?: string;
}

const PHONE_PATTERNS = [
  /\b03[0-9]{2}[-.\s]?[0-9]{7}\b/g, // Pakistani mobile (03001234567, 0300-1234567)
  /\+92[-.\s]?[0-9]{2,3}[-.\s]?[0-9]{7}\b/g, // +92 300 1234567
  /\b(?:0092|92)[-.\s]?[0-9]{2,3}[-.\s]?[0-9]{7}\b/g,
  /\b\+?(?:966|971|44|1)[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{6,8}\b/g, // SA, UAE, UK, US
  /\b[0-9]{4}[-.\s]?[0-9]{7}\b/g, // Generic 11 digits
];

const WHATSAPP_PATTERNS = [
  /wa\.me\/[0-9]+/i,
  /whatsapp(?:\.com)?/i,
  /\bwa\b\s*[:=]?\s*[0-9]+/i,
  /whats\s*app/i,
];

const PAYMENT_DIRECT_PATTERNS = [
  /\b(?:easypaisa|jazzcash|sadapay|nayapay|paymob|upaisa)\b/i,
  /\b(?:iban|account\s*number|acct\s*#|bank\s*transfer|direct\s*transfer)\b/i,
  /\bPK[0-9]{2}[A-Z]{4}[0-9]{16}\b/i, // Pakistani IBAN
];

const CONTACT_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
  /\b(?:telegram|t\.me|skype|instagram|insta\s*id|snapchat)\b/i,
];

/**
 * Scans a message for platform circumvention attempts.
 */
export function scanForCircumvention(text: string): CircumventionScanResult {
  if (!text || typeof text !== "string") {
    return { detected: false, score: 0, categories: [] };
  }

  const categories: string[] = [];
  let score = 0;
  let matchedPattern: string | undefined;

  for (const regex of PHONE_PATTERNS) {
    if (regex.test(text)) {
      categories.push("phone_number");
      score += 45;
      matchedPattern = "phone_number";
      break;
    }
  }

  for (const regex of WHATSAPP_PATTERNS) {
    if (regex.test(text)) {
      categories.push("whatsapp_reference");
      score += 40;
      matchedPattern = matchedPattern || "whatsapp";
      break;
    }
  }

  for (const regex of PAYMENT_DIRECT_PATTERNS) {
    if (regex.test(text)) {
      categories.push("off_platform_payment");
      score += 50;
      matchedPattern = matchedPattern || "direct_payment";
      break;
    }
  }

  for (const regex of CONTACT_PATTERNS) {
    if (regex.test(text)) {
      categories.push("external_social_contact");
      score += 30;
      matchedPattern = matchedPattern || "social_contact";
      break;
    }
  }

  const finalScore = Math.min(100, score);
  return {
    detected: finalScore >= 35,
    score: finalScore,
    categories,
    matchedPattern,
  };
}
