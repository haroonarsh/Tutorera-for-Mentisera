// hooks/useTutorGuard.ts
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

export function useTutorGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "approved" | "pending" | "rejected" | "not-tutor" | "error">("loading");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "tutor") {
      // Not a tutor at all — distinct from "approved". Callers should treat
      // this the same as being blocked, not as passing the guard.
      setStatus("not-tutor");
      return;
    }

    api.get("/tutors/onboarding/status")
      .then(res => setStatus(res.data.verificationStatus))
      .catch(() => {
        // Fail CLOSED — a network/API error means we genuinely don't know
        // the tutor's status, so we must not assume "approved".
        setStatus("error");
      });
  }, [user, loading, router]);

  useEffect(() => {
    if (status === "pending" || status === "rejected" || status === "not-tutor") {
      router.replace("/dashboard");
    }
    if (status === "error") {
      // Don't silently redirect on a transient network error — that could bounce
      // a legitimately approved tutor away from a page they should see. Let the
      // calling page decide how to handle "error" (e.g. show a retry message).
    }
  }, [status, router]);

  return status;
}