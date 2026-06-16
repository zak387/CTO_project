"use client";
import * as React from "react";

/* transitions.dev — number pop-in. Each digit re-enters with a blurred slide
   when the value changes. Implemented with React keys: a changed value remounts
   the group so the CSS animation replays; an unchanged value (e.g. a poll that
   returns the same count) reuses the node and stays still. */

export function PopNumber({ value, className }: { value: number | string; className?: string }) {
  const str = String(value);
  const chars = str.split("");
  return (
    <span key={str} className={["t-digit-group is-animating", className].filter(Boolean).join(" ")}>
      {chars.map((ch, i) => {
        const stagger = i === chars.length - 2 ? "1" : i === chars.length - 1 ? "2" : undefined;
        return (
          <span className="t-digit" data-stagger={stagger} key={i}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}
