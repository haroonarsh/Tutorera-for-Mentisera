// hooks/useAppGuard.ts
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

type GuardStatus = "loading" | "ok" | "blocked";

/**
 * Guards pages meant for logged-in students and tutors (not admins).
 * - Logged-out visitors → redirected to /login
 * - Admins → redirected away (not meant for admin pages)
 * - Students → allowed through immediately
 * - Tutors → must be an approved tutor; pending/rejected are redirected to /dashboard
 * - Network/API errors while checking tutor status → fail closed (blocked), not silently approved
 */
export function useAppGuard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<GuardStatus>("loading");

    useEffect(() => {
        if (loading) return;

        if (!user) {
        router.replace("/login");
        return;
        }

        if (user.role === "admin") {
        router.replace("/admin");
        return;
        }

        if (user.role === "student") {
        setStatus("ok");
        return;
        }

        if (user.role === "tutor") {
        api.get("/tutors/onboarding/status")
            .then(res => {
            if (res.data.verificationStatus === "approved") {
                setStatus("ok");
            } else {
                setStatus("blocked");
                router.replace("/dashboard");
            }
            })
            .catch(() => {
            // Fail closed — don't assume approved on a network error.
            setStatus("blocked");
            });
        return;
        }

        // Any other/unknown role (e.g. "pending" role from Google sign-up flow) — block.
        setStatus("blocked");
        router.replace("/select-role");
    }, [user, loading, router]);

    return status;
}