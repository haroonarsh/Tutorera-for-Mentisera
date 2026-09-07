import { Request, Response } from "express";
import { AuthRequest } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const TUTORERA_SYSTEM_PROMPT = `You are TUTORERA®'s AI assistant — a helpful, friendly support bot for TUTORERA's global student-led tutoring marketplace.

ABOUT TUTORERA®:
- TUTORERA® is a global student-led tutoring marketplace connecting learners with verified tutors for online learning worldwide and local home tuition where enabled
- Production website: tutorera.ac.pk | Operated by MENTISERA (SMC-PRIVATE) LIMITED
- Initial local coverage includes Pakistan cities such as Islamabad, Rawalpindi, Lahore, Karachi, Peshawar, Quetta, Multan, and Faisalabad; global online tutoring is supported by tutor availability and country launch settings

HOW IT WORKS:
- Students post tuition requests describing what they need
- TUTORERA matches the request to relevant eligible tutors
- Verified tutors accept the proposed budget or send structured offers/counter-offers
- Students compare match score, qualifications, verification, reviews, availability, and price before choosing
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
- Eligible first sessions are covered by published first-session protection rules; outcomes may include replacement, credit, or refund review

PLATFORM FEES:
- Student marketplace fee is currently 0%
- Tutor marketplace fee: 20% + 15% GST on the tutor fee = 23% effective deduction from tutor earnings
- Example: Tutor charges PKR 1,000 → Student currently pays PKR 1,000 → tutor fee and tax are deducted from tutor earnings according to the disclosed marketplace fee model.

PAYMENTS:
- Secure online payment will be processed through TUTORERA's authorized payment gateway.
- For payment account details, refer to your booking confirmation or contact support at hello@mentisera.pk

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

  const stripImageRefs = (text: string) =>
    text.replace(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)/gi, "[image]").replace(/data:image\/\w+;base64,\S+/gi, "[image]");

  const cleanMessage = stripImageRefs(message);

  // Build OpenAI-style messages array for Groq:
  // system prompt -> conversation history -> current message
  const messages = [
    { role: "system", content: TUTORERA_SYSTEM_PROMPT },
    ...(history || []).map((msg: { role: string; text: string }) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: stripImageRefs(msg.text),
    })),
    { role: "user", content: cleanMessage },
  ];

  const requestBody = {
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 1200,
  };

  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      res.status(503).json({ success: false, message: "AI service is not configured. Please contact support." });
      return;
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
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

const REQUEST_PARSE_SYSTEM_PROMPT = `You are TUTORERA's request parser. Extract structured tuition request data from free-text input. Return ONLY a valid JSON object with these exact fields:
- subject: string (e.g. "Mathematics", "Physics", "English")
- level: string (e.g. "Matric", "FSc", "O-Level", "A-Level", "University")
- city: string (e.g. "Lahore", "Karachi", "Islamabad") or null if not mentioned
- countryCode: string (2-letter code, default "PK") or null
- teachingMode: "online" | "in-person" | "both" (default "both" if not specified)
- budget: number (hourly rate in PKR, extract from text like "1500 per hour") or null if not mentioned
- schedule: string (brief description of preferred days/times) or null
- language: string (language of instruction) or null

Rules:
- If a field cannot be determined from the input, use null
- budget should be a number (PKR per hour)
- Return ONLY the JSON, no markdown, no explanation, no text before or after
- Example input: "I need physics tutor for my FSc son in Lahore, willing to pay 2000 per hour on weekends"
- Example output: {"subject":"Physics","level":"FSc","city":"Lahore","countryCode":"PK","teachingMode":"both","budget":2000,"schedule":"weekends","language":"English"}`;

export const parseRequestText = async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body as { text?: unknown };

  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ success: false, message: "Text is required." });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(503).json({ success: false, message: "AI service is not configured." });
    return;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: REQUEST_PARSE_SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      res.status(500).json({ success: false, message: "AI service unavailable." });
      return;
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const raw = data.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }

    res.status(200).json({ success: true, parsed });
  } catch (err) {
    console.error("Request parse failed:", err);
    res.status(500).json({ success: false, message: "AI service unavailable." });
  }
};
