import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rise Moon",
  description: "Lunar cycle chain game"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}