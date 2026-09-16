import { MessageCircle } from "lucide-react";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/site";

export interface WhatsAppChatButtonProps {
  /** E.164 digits only, no "+" (e.g. "923348880859"). Defaults to TUTORERA support. */
  phoneNumber?: string;
  /** Prefilled message inserted into the WhatsApp compose box. */
  message: string;
  /** Visual weight - "solid" for a primary action, "outline" for a secondary one. */
  variant?: "solid" | "outline";
  label?: string;
  className?: string;
}

/**
 * Reusable click-to-chat link: https://wa.me/{number}?text={prefilled_message}
 *
 * Defaults to TUTORERA's own support number rather than a tutor's phone number.
 * Tutor contact details aren't exposed to students before a booking is accepted
 * and paid for - doing so would let either side move the conversation off-platform
 * before TUTORERA's commission applies. Pass an explicit `phoneNumber` only for
 * flows where contacting a specific tutor directly is an intended, approved behavior.
 */
export default function WhatsAppChatButton({
  phoneNumber = SUPPORT_WHATSAPP_NUMBER,
  message,
  variant = "solid",
  label = "Chat on WhatsApp",
  className,
}: WhatsAppChatButtonProps) {
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  const solid = variant === "solid";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "0.65rem 1.1rem",
        borderRadius: "0.6rem",
        fontSize: "0.85rem",
        fontWeight: 700,
        textDecoration: "none",
        background: solid ? "#25d366" : "white",
        color: solid ? "white" : "#128c4a",
        border: solid ? "none" : "1.5px solid #25d366",
      }}
    >
      <MessageCircle size={16} />
      <span>{label}</span>
    </a>
  );
}
