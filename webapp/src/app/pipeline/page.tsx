"use client";
import { useState } from "react";
import { useLeads, type Lead } from "@/lib/useLeads";
import { OUTBOUND_STAGES, INBOUND_STAGES, STAGE_LABELS } from "@/lib/stages";
import LeadDrawer from "@/components/LeadDrawer";
import { LiquidGlass } from "@/components/LiquidGlass";

const LED: Record<string, string> = {
  connection_sent: "#94a3b8", connected: "#3b6bd6", message_sent: "#c97a12",
  replied: "#d23f6b", booked: "#0f9d6e", signed_up: "#94a3b8", emailed: "#c97a12",
};

export default function Pipeline() {
  const { leads, refresh } = useLeads();
  const [channel, setChannel] = useState<"outbound" | "inbound">("outbound");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const stages = channel === "inbound" ? INBOUND_STAGES : OUTBOUND_STAGES;
  const inChannel = (l: Lead) => l.channel === channel || l.channel === "both";
  const visible = leads.filter(inChannel);

  return (
    <>
      <div className="top"><div className="t-stagger"><h1 className="t-stagger-line t-stagger-line--1">Lead Pipeline</h1>
        <div className="sub t-stagger-line t-stagger-line--2">Cards move on their own as Dripify &amp; Calendly fire.</div></div></div>

      <div className="controls">
        <div className="seg">
          <LiquidGlass as="button" className={channel === "outbound" ? "on" : ""} tint={channel === "outbound" ? "rgba(37,99,235,.16)" : undefined} onClick={() => setChannel("outbound")}>
            Outbound {leads.filter((l) => l.channel !== "inbound").length}
          </LiquidGlass>
          <LiquidGlass as="button" className={channel === "inbound" ? "on" : ""} tint={channel === "inbound" ? "rgba(37,99,235,.16)" : undefined} onClick={() => setChannel("inbound")}>
            Inbound {leads.filter((l) => l.channel !== "outbound").length}
          </LiquidGlass>
        </div>
      </div>

      <div className={`board ${channel}`}>
        {stages.map((stage) => {
          const cards = visible.filter((l) => l.stage === stage);
          return (
            <div className={`col ${stage === "replied" ? "replied" : ""} ${stage === "booked" ? "booked" : ""}`} key={stage}>
              <div className="col-h">
                <div className="t"><span className="led" style={{ background: LED[stage] }} /> {STAGE_LABELS[stage]}</div>
                <span className="ct">{cards.length}</span>
              </div>
              <div className="cards">
                {cards.map((l) => (
                  <div className="lc" key={l.id} onClick={() => setSelectedId(l.id)}>
                    <div className="nm">{l.name}</div>
                    <div className="ro">{l.title} · {l.company}</div>
                    {stage === "message_sent" && (() => {
                      const n = l.events.filter((e) => e.type === "message_sent").length;
                      return <span className="follow">{n} follow-up{n === 1 ? "" : "s"} sent</span>;
                    })()}
                    {stage === "replied" && <span className="star">Waiting on Adam</span>}
                    {stage === "booked" && l.meetingAt && (
                      <span className="mt">{new Date(l.meetingAt).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <LeadDrawer lead={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </>
  );
}
