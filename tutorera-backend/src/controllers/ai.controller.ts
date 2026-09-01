import { Request, Response } from "express";
import { AuthRequest } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const TUTORERA_SYSTEM_PROMPT = `You are TUTORERA®'s AI assistant — a helpful, friendly support bot for Pakistan's tutoring marketplace platform.

ABOUT TUTORERA®:
- TUTORERA® is Pakistan's online tutoring marketplace connecting students with verified tutors
- Website: tutorera.mentisera.pk | Operated by MENTISERA (SMC-PRIVATE) LIMITED
- Available across Pakistan: Islamabad, Rawalpindi, Lahore, Karachi, Peshawar, Quetta, Multan, Faisalabad

HOW IT WORKS:
- Students post tuition requests describing what they need
- Verified tutors accept the proposed budget or send offers on those requests
- Students review offers and accept the best one
- A booking is created automatically
- Students can also book tutors directly from their profile using the "Book Now" button

TUTORS:
- Must complete a 5-step onboarding (personal info, education, experience, profile setup, verification docs)
- Must upload CNIC front/back and optional intro video
- In-person tutors must upload a police clearance certificate
- Profiles are reviewed and approved by the admin team within 24-48 hours
- Tutors set their own hourly rates and weekly availability

STUDENTS:
- Can browse tutors by subject, level, city, teaching mode, price, and rating
- Can post tuition requests and receive offers from tutors
- Can book tutors directly from their profile
- Can save favourite tutors
- Get a First Session Guarantee — if not satisfied with the first session, can claim a credit or refund

PLATFORM FEES:
- Platform fee: 20% + 15% GST on platform fee = 23% total
- Charged to both student and tutor
- Example: Tutor charges PKR 1,000 → Student currently pays PKR 1,000 → tutor fee and tax are deducted from tutor earnings according to the disclosed marketplace fee model.

PAYMENTS:
- Secure online payment will be processed through TUTORERA's authorized payment gateway upon merchant activation.
- Account Title: MENTISERA (SMC-PRIVATE) LIMITED
- IBAN: PK27NAYA7556428306882526
- Payment is verified server-side before a booking is treated as paid.
- Payment confirmed within 24 hours

REFERRAL PROGRAM:
- Share your referral code with friends
- Friend gets PKR 200 credit on their first booking
- You get PKR 200 credit when they complete their first booking

RATINGS:
- Students rate tutors after completed sessions (public, shown on tutor profile)
- Tutors rate students after completed sessions (private, admin only)

SUPPORT:
- Email: hello@mentisera.pk
- WhatsApp: +92 334 888 0859
- In-session support: use the "Need Help?" button on your booking card

PLANS:
- Free: 3 offers/month for tutors, 2 requests/month for students
- Standard: PKR 500/month — 10 offers/month
- Premium: PKR 1,000/month — unlimited offers, featured profile, priority listing

IMPORTANT RULES FOR YOU:
- Only answer questions related to TUTORERA® platform
- If asked about anything unrelated (general knowledge, other topics, math problems, etc.), politely say: "I can only help with TUTORERA® related questions. For other queries, please contact our support team at hello@mentisera.pk"
- Keep answers concise and helpful
- Always be friendly and professional
- Respond in the same language the user writes in (Urdu or English)
- Never make up information not listed above`;

export const chatWithAI = async (req: AuthRequest, res: Response): Promise<void> => {
  const { message, history } = req.body;

  if (!["student", "tutor"].includes(req.user?.role || "")) {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  if (!message?.trim()) {
    res.status(400).json({ success: false, message: "Message is required." });
    return;
  }

  // Build OpenAI-style messages array for Groq:
  // system prompt -> conversation history -> current message
  const messages = [
    { role: "system", content: TUTORERA_SYSTEM_PROMPT },
    ...(history || []).map((msg: { role: string; text: string }) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text,
    })),
    { role: "user", content: message },
  ];

  const requestBody = {
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 500,
  };

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      res.status(500).json({ success: false, message: "AI service unavailable. Please try again." });
      return;
    }

    const data = await response.json() as {
      choices?: {
        message?: {
          content?: string;
        };
      }[];
    };

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      res.status(500).json({ success: false, message: "No response from AI." });
      return;
    }

    res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("AI chat request failed:", err);
    res.status(500).json({ success: false, message: "AI service unavailable. Please try again." });
  }
};
