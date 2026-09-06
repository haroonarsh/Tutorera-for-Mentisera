"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), { ssr: false });
const AIChatWidget = dynamic(() => import("@/components/AIChatWidget"), { ssr: false });
const CookieBanner = dynamic(() => import("@/components/CookieBanner"), { ssr: false });
const LiveRequestPopup = dynamic(() => import("@/components/marketplace/LiveRequestPopup"), { ssr: false });

// Pages where widgets don't belong — app-internal/chat/admin areas.
const HIDE_CHAT_WIDGETS = [
    "/onboarding",
    "/chat",
    "/admin",
    "/login",
    "/register",
    "/forgot-password",
];

export default function LazyWidgets() {
    const pathname = usePathname();

    const hideChatWidgets = HIDE_CHAT_WIDGETS.some(path => pathname.startsWith(path));

    return (
        <>
        {!hideChatWidgets && (
            <>
            <WhatsAppButton />
            <AIChatWidget />
            <LiveRequestPopup />
            </>
        )}
        <CookieBanner />
        </>
    );
}