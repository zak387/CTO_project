import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
import { GlassFilter } from "@/components/LiquidGlass";

export const metadata: Metadata = {
  title: "SAWA Command — NY CTO Dinner",
  description: "Campaign command center",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GlassFilter />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
