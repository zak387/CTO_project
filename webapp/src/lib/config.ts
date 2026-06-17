// Campaign-level config. Swap LANDING_URL for the real inbound signup page
// (or set NEXT_PUBLIC_LANDING_URL in the environment).
export const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ?? "https://tech-leader-dinner.vercel.app/";
