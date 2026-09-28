import React from "react";
import TutorGuard from "@/components/TutorGuard";

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return <TutorGuard>{children}</TutorGuard>;
}
