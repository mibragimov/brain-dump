import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brain Dump",
  description: "Just dump everything in your head",
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
