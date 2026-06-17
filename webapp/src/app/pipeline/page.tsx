"use client";
import { useState, useEffect } from "react";
import { useLeads, type Lead } from "@/lib/useLeads";
import { OUTBOUND_STAGES, INBOUND_STAGES, STAGE_LABELS } from "@/lib/stages";
import LeadDrawer from "@/components/LeadDrawer";
import { LiquidGlass } from "@/components/LiquidGlass";

const LED: Record<string, string> = {
  connection_sent: "#94a3b8", replied: "#d23f6b", booked: "#0f9d6e",
  signed_up: "#94a3b8", emailed: "#c97a12",
};

const daysToEvent = () =>
  Math.max(0, Math.ceil((new Date("2026-07-22").getTime() - Date.now()) / 86400000));

export default function Pipeline() {
  const { leads, refresh } = useLeads();
  const [channel, setChannel] = useState<"outbound" | "inbound">("outbound");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  // On mobile, start every column collapsed so you land on a compact stack of
  // tappable bars instead of scrolling through hundreds of cards.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- matchMedia is client-only; collapse once after mount
      setCollapsed({ connection_sent: true, replied: true, booked: true, signed_up: true });
    }
  }, []);

  const stages = channel === "inbound" ? INBOUND_STAGES : OUTBOUND_STAGES;
  const inChannel = (l: Lead) => l.channel === channel || l.channel === "both";
  const visible = leads.filter(inChannel);
  const toggle = (s: string) => setCollapsed((c) => ({ ...c, [s]: !c[s] }));

  return (
    <>
      <div className="top">
        <div className="t-stagger"><h1 className="t-stagger-line t-stagger-line--1">Lead Pipeline</h1>
          <div className="sub t-stagger-line t-stagger-line--2">Cards move on their own as Dripify &amp; Calendly fire.</div></div>
        <LiquidGlass className="countdown" tint="rgba(255,255,255,.5)"><b>{daysToEvent()}</b><span>days to dinner · Jul 22</span></LiquidGlass>
      </div>

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
          const isCollapsed = !!collapsed[stage];
          return (
            <div className={`col ${stage === "replied" ? "replied" : ""} ${stage === "booked" ? "booked" : ""} ${isCollapsed ? "collapsed" : ""}`} key={stage}>
              <button className="col-h" onClick={() => toggle(stage)} aria-expanded={!isCollapsed}>
                <div className="t"><span className="led" style={{ background: LED[stage] }} /> {STAGE_LABELS[stage]}</div>
                <span className="ct">{cards.length}</span>
                <span className={`col-chev ${isCollapsed ? "down" : ""}`} aria-hidden>▾</span>
              </button>
              {!isCollapsed && (
                <div className="cards">
                  {cards.map((l) => (
                    <div className="lc" key={l.id} onClick={() => setSelectedId(l.id)}>
                      <div className="nm">{l.name}</div>
                      <div className="ro">{l.title} · {l.company}</div>
                      {stage === "booked" && l.meetingAt && (
                        <span className="mt">{new Date(l.meetingAt).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
