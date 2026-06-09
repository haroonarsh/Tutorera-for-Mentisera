// app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentDashboard from "@/components/Dashboard/StudentDashboard";
import TutorDashboard from "@/components/Dashboard/TutorDashboard";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <DashboardLayout>
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #e5e7eb",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
        Loading your dashboard…
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
    </DashboardLayout>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <LoadingScreen />;

  // Render the correct dashboard based on role
  if (user.role === "tutor") {
    return (
      <DashboardLayout>
      <TutorDashboard
        userId={user._id}
        userName={user.name}
        userAvatar={user.avatar}
      />
      </DashboardLayout>
    );
  }

  // Default: student
  return (
    <DashboardLayout>
    <StudentDashboard
      userName={user.name}
      userAvatar={user.avatar}
    />
    </DashboardLayout>
  );
}