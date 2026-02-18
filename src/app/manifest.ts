import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brain Dump + AI",
    short_name: "BrainDump",
    description: "Zero-friction brain dumps turned into summaries and actionable tasks.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
