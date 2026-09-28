"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

interface TutorGuardProps {
  children: React.ReactNode;
}

export default function TutorGuard({ children }: TutorGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.role === "pending") {
      router.replace("/select-role");
      return;
    }

    if (user.role !== "tutor") {
      router.replace("/dashboard");
      return;
    }

    // Exclude application-status and resubmit-docs from verification requirement so tutors can fix their profile
    if (
      pathname.startsWith("/tutor/application-status") ||
      pathname.startsWith("/tutor/resubmit-docs") ||
      pathname.startsWith("/tutor/guidebook") ||
      pathname.startsWith("/onboarding/tutor")
    ) {
      setChecking(false);
      setAuthorized(true);
      return;
    }

    api
      .get("/tracking/application-status", { timeout: 8000 })
      .then((res) => {
        const eligible = res.data?.payload?.marketplaceEligibility?.eligible;
        if (eligible) {
          setAuthorized(true);
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        router.replace("/dashboard");
      })
      .finally(() => {
        setChecking(false);
      });
  }, [user, loading, router, pathname]);

  if (loading || checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #0329B2",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
