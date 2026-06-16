import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow testing the dev server from phones/other devices on the LAN.
  // Without this, Next 16 blocks /_next dev resources cross-origin, so the
  // page renders but never hydrates (interactivity like the nav dropdown dies).
  allowedDevOrigins: ["192.168.1.11"],
};

export default nextConfig;
