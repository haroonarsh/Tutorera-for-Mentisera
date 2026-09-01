import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TUTORERA",
    short_name: "TUTORERA",
    description: "Post your requirement, compare tutor offers, and book online or in-person tutoring in Pakistan.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F9FC",
    theme_color: "#0329B2",
    icons: [
      { src: "/tutorera-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/tutorera-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/tutorera-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/tutorera-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/tutorera-icon-180.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
