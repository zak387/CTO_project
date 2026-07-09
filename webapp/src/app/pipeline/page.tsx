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
  const { leads: allLeads, refresh } = useLeads();
  const [channel, setChannel] = useState<"outbound" | "inbound">("outbound");
  const [campaign, setCampaign] = useState<"all" | "1" | "2">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // Campaign filter scopes the whole board. "all" shows everything; "1"/"2"
  // narrow to one outbound push (all inbound signups live under "1"). Every
  // downstream count/column reads `leads`, so filtering here is enough.
  const leads = campaign === "all" ? allLeads : allLeads.filter((l) => l.campaign === campaign);
  // Look the drawer's lead up in the full set so it stays open across a switch.
  const selected = allLeads.find((l) => l.id === selectedId) ?? null;

  // On mobile, start every column collapsed so you land on a compact stack of
  // tappable bars instead of scrolling through hundreds of cards.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- matchMedia is client-only; collapse once after mount
      setCollapsed({ connection_sent: true, replied: true, booked: true, signed_up: true });
    }
  }, []);

  // Booked leads live only in Meetings (left nav) — drop the "Booked" column
  // from both boards so the pipeline shows just the work-in-progress stages.
  const stages = (channel === "inbound" ? INBOUND_STAGES : OUTBOUND_STAGES).filter((s) => s !== "booked");
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
        <div className="seg">
          <LiquidGlass as="button" className={campaign === "all" ? "on" : ""} tint={campaign === "all" ? "rgba(37,99,235,.16)" : undefined} onClick={() => setCampaign("all")}>
            All ({allLeads.length})
          </LiquidGlass>
          <LiquidGlass as="button" className={campaign === "1" ? "on" : ""} tint={campaign === "1" ? "rgba(37,99,235,.16)" : undefined} onClick={() => setCampaign("1")}>
            Campaign 1 ({allLeads.filter((l) => l.campaign === "1").length})
          </LiquidGlass>
          <LiquidGlass as="button" className={campaign === "2" ? "on" : ""} tint={campaign === "2" ? "rgba(37,99,235,.16)" : undefined} onClick={() => setCampaign("2")}>
            Campaign 2 ({allLeads.filter((l) => l.campaign === "2").length})
          </LiquidGlass>
        </div>
      </div>

      <div className={`board ${channel}`}>
        {stages.map((stage) => {
          const cards = visible.filter((l) => l.stage === stage);
          const isCollapsed = !!collapsed[stage];
          return (
            <div className={`col ${stage === "replied" ? "replied" : ""} ${isCollapsed ? "collapsed" : ""}`} key={stage}>
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
