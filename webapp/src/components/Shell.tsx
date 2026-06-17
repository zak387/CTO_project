"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

/* Lucide-style line icons — stroke = currentColor, sized via .ic */
const S = (p: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {p.children}
  </svg>
);

const ICONS: Record<string, ReactNode> = {
  overview: <S><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></S>,
  pipeline: <S><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" /></S>,
  meetings: <S><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" /><path d="m9 16 2 2 4-4" /></S>,
  artefacts: <S><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></S>,
};

const chevron = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;

type Leaf = { href: string; label: string; ic: string };
type Group = { label: string; ic: string; base: string; children: { href: string; label: string }[] };

const NAV: (Leaf | Group)[] = [
  { href: "/pipeline", label: "Lead Pipeline", ic: "pipeline" },
  { href: "/meetings", label: "Meetings Booked", ic: "meetings" },
  {
    label: "Artefacts", ic: "artefacts", base: "/artefacts",
    children: [
      { href: "/artefacts/posts", label: "Posts" },
      { href: "/artefacts/messages", label: "LinkedIn messages" },
      { href: "/artefacts/landing", label: "Landing page" },
    ],
  },
];

const isGroup = (n: Leaf | Group): n is Group => "children" in n;

// flat list (used by the mobile dropdown selector). Sub-views lose the visible
// "Artefacts" parent on mobile, so prefix them: "Artefacts - <view>".
const FLAT: Leaf[] = NAV.flatMap((n) =>
  isGroup(n) ? n.children.map((c) => ({ href: c.href, label: `Artefacts - ${c.label}`, ic: n.ic })) : [n]
);

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);            // mobile menu
  const [expanded, setExpanded] = useState(false);    // manual toggle of the Artefacts group

  const current = FLAT.find((n) => n.href === path) ?? FLAT[0];

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <span className="dot">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.6 6.8L21 11l-6.4 2.2L12 20l-2.6-6.8L3 11l6.4-2.2z" />
            </svg>
          </span>
          <div>SAWA Command<small>NY CTO Dinner</small></div>
        </div>

        {/* desktop: full vertical nav */}
        <nav className="nav">
          {NAV.map((n) => {
            if (!isGroup(n)) {
              return (
                <Link key={n.href} href={n.href} className={path === n.href ? "active" : ""}>
                  <span className="ic">{ICONS[n.ic]}</span> {n.label}
                </Link>
              );
            }
            const groupActive = path.startsWith(n.base);
            const isOpen = groupActive || expanded;
            return (
              <div key={n.base} className={`navgroup ${isOpen ? "open" : ""}`}>
                <button
                  className={`navparent ${groupActive ? "on" : ""}`}
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={isOpen}
                >
                  <span className="ic">{ICONS[n.ic]}</span> {n.label}
                  <span className="chev">{chevron}</span>
                </button>
                <div className="subnav">
                  {n.children.map((c) => (
                    <Link key={c.href} href={c.href} className={path === c.href ? "active" : ""}>
                      <span className="tick" /> {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* mobile: current page + arrow, opens a dropdown to all views */}
        <div className="navdrop">
          <button className="navsel" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <span className="ic">{ICONS[current.ic]}</span>
            <span className="navsel-lbl">{current.label}</span>
            <span className={`navchev ${open ? "up" : ""}`}>▾</span>
          </button>
          {open && (
            <>
              <div className="navback" onClick={() => setOpen(false)} />
              <div className="navmenu">
                {FLAT.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={path === n.href ? "active" : ""}
                    onClick={() => setOpen(false)}
                  >
                    <span className="ic">{ICONS[n.ic]}</span> {n.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="live"><span className="pulse" /> Live · auto-syncing</div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
