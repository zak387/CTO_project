"use client";
import { useState } from "react";
import { useLeads, timeAgo, initials, type Lead } from "@/lib/useLeads";
import LeadDrawer from "@/components/LeadDrawer";

const daysToEvent = () =>
  Math.max(0, Math.ceil((new Date("2026-07-21").getTime() - Date.now()) / 86400000));

const isReplied = (l: Lead) => l.stage === "replied";
const isBooked = (l: Lead) => l.stage === "booked";
const repliedAt = (l: Lead) =>
  l.events.filter((e) => e.type === "replied").slice(-1)[0]?.at ?? l.updatedAt;

const w = (v: string) => ({ ["--w"]: v } as React.CSSProperties);

export default function Briefing() {
  const { leads, loaded, refresh } = useLeads();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const waiting = leads
    .filter(isReplied)
    .sort((a, b) => +new Date(repliedAt(b)) - +new Date(repliedAt(a)));
  const booked = leads.filter(isBooked);
  const meetings = booked
    .filter((l) => l.meetingAt)
    .sort((a, b) => +new Date(a.meetingAt!) - +new Date(b.meetingAt!));

  const engaged = leads.filter((l) =>
    ["connected", "message_sent", "emailed", "replied", "booked"].includes(l.stage)
  ).length;
  const replied = leads.filter((l) => ["replied", "booked"].includes(l.stage)).length;
  const outBooked = booked.filter((l) => l.channel !== "inbound").length;
  const inBooked = booked.filter((l) => l.channel === "inbound").length;
  const total = Math.max(leads.length, 1);
  const pct = (n: number) => Math.round((n / total) * 100) + "%";

  return (
    <>
      <div className="top">
        <div>
          <h1>Good morning, Adam 👋</h1>
          <div className="sub">Who needs you, and how the campaign&apos;s moving. {loaded ? "" : "Loading…"}</div>
        </div>
        <div className="countdown"><b>{daysToEvent()}</b><span>days to dinner · Jul 21</span></div>
      </div>

      {/* HERO */}
      <section className="card hero">
        <h2><span>⚑ Waiting on you <span className="tag">— they replied on LinkedIn and are waiting for you to message them back</span></span> <span className="cnt">{waiting.length}</span></h2>
        {waiting.length === 0 ? (
          <div className="empty">All caught up — nobody&apos;s waiting. 🎉</div>
        ) : (
          waiting.map((l) => (
            <div className="wrow" key={l.id} onClick={() => setSelectedId(l.id)} style={{ cursor: "pointer" }}>
              <div className="av">{initials(l.name)}</div>
              <div className="who">
                <a className="wname" href={l.linkedinUrl ?? "#"} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  {l.name} ↗
                </a>
                <div className="role">{l.title} · {l.company}</div>
              </div>
              <span className={`pill ${l.channel === "inbound" ? "in" : "out"}`}>
                {l.channel === "inbound" ? "IN" : "OUT"}
              </span>
              <div className="ago">{timeAgo(repliedAt(l))}</div>
            </div>
          ))
        )}
      </section>

      <div className="grid">
        {/* FUNNEL */}
        <section className="card">
          <h2>Campaign funnel <span className="tag">outbound + inbound</span></h2>
          <div className="funnel">
            <div className="frow"><div className="name">Contacted</div><div className="bar"><i style={w("100%")}>{leads.length}</i></div></div>
            <div className="frow"><div className="name">Connected / Engaged</div><div className="bar"><i style={w(pct(engaged))}>{engaged}</i></div></div>
            <div className="frow"><div className="name">Replied / Signed up</div><div className="bar"><i style={w(pct(replied))}>{replied}</i></div></div>
            <div className="frow"><div className="name">Booked</div><div className="bar"><i style={w(pct(booked.length))}>{booked.length}</i></div></div>
          </div>
          <div className="split">
            <div className="chip"><div className="t">Outbound booked</div><div className="v">{outBooked}</div></div>
            <div className="chip"><div className="t">Inbound booked</div><div className="v">{inBooked}</div></div>
          </div>
        </section>

        {/* NEXT MEETINGS */}
        <section className="card">
          <h2>Next meetings <span className="tag">with Adam</span></h2>
          {meetings.length === 0 ? (
            <div className="empty">No calls booked yet.</div>
          ) : (
            meetings.map((l) => {
              const d = new Date(l.meetingAt!);
              return (
                <div className="mtg" key={l.id}>
                  <div className="dchip">
                    <b>{d.getDate()}</b>
                    <span>{d.toLocaleString("en", { month: "short" })}</span>
                  </div>
                  <div className="info">
                    <b>{l.name} — {l.company}</b>
                    <small>Intro call · {l.channel === "inbound" ? "inbound" : "outbound"}</small>
                  </div>
                  <div className="time">{d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {selected && (
        <LeadDrawer lead={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </>
  );
}
