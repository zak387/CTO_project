"use client";
import { useState } from "react";
import { useLeads, type Lead } from "@/lib/useLeads";
import LeadDrawer from "@/components/LeadDrawer";
import { PopNumber } from "@/components/PopNumber";

const dayKey = (d: Date) => d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
const time = (d: Date) => d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });

function groupByDay(rows: Lead[]) {
  const groups: { day: string; rows: Lead[] }[] = [];
  for (const l of rows) {
    const k = dayKey(new Date(l.meetingAt!));
    const g = groups.find((x) => x.day === k);
    if (g) g.rows.push(l);
    else groups.push({ day: k, rows: [l] });
  }
  return groups;
}

export default function Meetings() {
  const { leads, refresh } = useLeads();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const booked = leads.filter((l) => l.stage === "booked" && l.meetingAt);
  const now = Date.now();
  const upcoming = booked
    .filter((l) => new Date(l.meetingAt!).getTime() >= now)
    .sort((a, b) => +new Date(a.meetingAt!) - +new Date(b.meetingAt!));
  const past = booked
    .filter((l) => new Date(l.meetingAt!).getTime() < now)
    .sort((a, b) => +new Date(b.meetingAt!) - +new Date(a.meetingAt!));

  const Row = ({ l }: { l: Lead }) => (
    <div className="mrow" onClick={() => setSelectedId(l.id)}>
      <div className="mtime">{time(new Date(l.meetingAt!))}</div>
      <div className="minfo">
        <b>{l.name}</b> <span className="mrole">{l.title} · {l.company}</span>
      </div>
      <span className={`pill ${l.channel === "inbound" ? "in" : "out"}`}>{l.channel === "inbound" ? "IN" : "OUT"}</span>
    </div>
  );

  return (
    <>
      <div className="top"><div className="t-stagger">
        <h1 className="t-stagger-line t-stagger-line--1">Meetings Booked</h1>
        <div className="sub t-stagger-line t-stagger-line--2">Booked calls with Adam — nothing else.</div>
      </div></div>

      <section className="card">
        <h2>Upcoming <span className="cnt"><PopNumber value={upcoming.length} /></span></h2>
        {upcoming.length === 0 ? (
          <div className="empty">No calls booked yet — they&apos;ll appear here the moment someone books with Adam.</div>
        ) : groupByDay(upcoming).map((g) => (
          <div key={g.day}>
            <div className="dayhdr">{g.day}</div>
            {g.rows.map((l) => <Row key={l.id} l={l} />)}
          </div>
        ))}
      </section>

      <details className="card" style={{ marginTop: 18 }}>
        <summary className="psum">Past <span className="cnt" style={{ background: "#94a3b8" }}>{past.length}</span></summary>
        {past.length === 0 ? (
          <div className="empty">Nothing in the past yet.</div>
        ) : groupByDay(past).map((g) => (
          <div key={g.day}>
            <div className="dayhdr">{g.day}</div>
            {g.rows.map((l) => <Row key={l.id} l={l} />)}
          </div>
        ))}
      </details>

      {selected && <LeadDrawer lead={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />}
    </>
  );
}
