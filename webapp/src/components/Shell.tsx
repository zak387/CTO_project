"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", ic: "▣" },
  { href: "/pipeline", label: "Lead Pipeline", ic: "⇅" },
  { href: "/simulator", label: "Event Simulator", ic: "⚡" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <span className="dot">◆</span>
          <div>SAWA Command<small>NY CTO Dinner</small></div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={path === n.href ? "active" : ""}>
              <span className="ic">{n.ic}</span> {n.label}
            </Link>
          ))}
        </nav>
        <div className="live"><span className="pulse" /> Live · auto-syncing</div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
