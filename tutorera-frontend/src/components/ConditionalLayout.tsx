"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

const HIDE_NAVBAR_AND_FOOTER = [
  "/onboarding",
  "/chat",
  "/earnings",
  "/dashboard",
  "/settings",
  "/notifications",
  "/billing",
  "/profile",
  "/admin",
  "/login",
  "/register",
  "/support",
];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideAll = HIDE_NAVBAR_AND_FOOTER.some(path =>
    pathname.startsWith(path)
  );

  if (hideAll) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}