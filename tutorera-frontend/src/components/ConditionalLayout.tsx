"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

const HIDE_LAYOUT_PATHS = [
  "/onboarding",
  "/onboarding/tutor",
  "/onboarding/tutor/complete",
  "/onboarding/student",
  "/onboarding/student/complete",
  "/chat",
];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideLayout = HIDE_LAYOUT_PATHS.some(path =>
    pathname.startsWith(path)
  );

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}