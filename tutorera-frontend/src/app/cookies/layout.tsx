import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Cookie & Tracking Policy | TUTORERA",
  description: "Transparent information on TUTORERA cookies, local storage, Google AdSense advertising identifiers, and tracking technologies used to secure sessions and customize your experience.",
  alternates: { canonical: "/cookies" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
