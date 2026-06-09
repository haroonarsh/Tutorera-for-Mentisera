"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

const HIDE_NAVBAR_AND_FOOTER = [
  "/onboarding",
  "/chat",
  "/dashboard",
  "/settings",
  "/notifications",
  "/billing",
  "/profile",
];

const HIDE_FOOTER_ONLY = [
  "/dashboard",
  "/admin",
  "/profile",
  "/settings",
  "/notifications",
  "/billing",
];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideAll = HIDE_NAVBAR_AND_FOOTER.some(path => pathname.startsWith(path));
  const hideFooter = HIDE_FOOTER_ONLY.some(path => pathname.startsWith(path));

  if (hideAll) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}