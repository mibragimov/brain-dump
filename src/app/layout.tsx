import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brain Dump + AI",
  description: "Zero-friction brain dumps turned into organized knowledge and actionable tasks.",
  manifest: "/manifest.webmanifest",
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
