"use client";
import * as React from "react";

/* ───────────────────────────────────────────────────────────────────────────
   Liquid-glass treatment — ported natively from the liquid-glass-button
   component (this app is plain-CSS, not Tailwind/shadcn, so the effect is
   reproduced with our own classes in globals.css). Wrap any element to give it
   an SVG-refraction layer, an optional colour tint, and a layered glass rim.

   Usage:
     <LiquidGlass className="countdown">…</LiquidGlass>
     <LiquidGlass as="button" tint="rgba(37,99,235,.16)" onClick={…}>…</LiquidGlass>

   Requires <GlassFilter /> mounted once on the page (done in layout.tsx).
─────────────────────────────────────────────────────────────────────────── */

type LiquidGlassProps<T extends React.ElementType> = {
  as?: T;
  /** optional translucent fill behind the content (e.g. brand blue/green) */
  tint?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function LiquidGlass<T extends React.ElementType = "div">({
  as,
  tint,
  className,
  children,
  ...rest
}: LiquidGlassProps<T>) {
  const Tag = (as ?? "div") as React.ElementType;
  return (
    <Tag className={["lg", className].filter(Boolean).join(" ")} {...rest}>
      <span className="lg-refract" aria-hidden="true" />
      {tint ? <span className="lg-tint" aria-hidden="true" style={{ background: tint }} /> : null}
      <span className="lg-rim" aria-hidden="true" />
      <span className="lg-content">{children}</span>
    </Tag>
  );
}

/** The SVG displacement filter that powers the glass refraction. Mount once. */
export function GlassFilter() {
  return (
    <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves={1} seed={1} result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation={2} result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale={70} xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation={4} result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}
