// hooks/useTutorGuard.ts
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

export function useTutorGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "approved" | "pending" | "rejected">("loading");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "tutor") { setStatus("approved"); return; } // non-tutors pass through

    api.get("/tutors/onboarding/status")
      .then(res => setStatus(res.data.verificationStatus))
      .catch(() => setStatus("approved")); // fail open
  }, [user, loading]);

  useEffect(() => {
    if (status === "pending" || status === "rejected") {
      router.replace("/dashboard"); // send them back to the gate
    }
  }, [status]);

  return status;
}