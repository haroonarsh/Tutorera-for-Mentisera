import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutor Request Feed | TUTORERA",
  description: "Browse student tuition opportunities and submit proposals.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/tuition-requests",
  },
};

export default function BrowseRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
