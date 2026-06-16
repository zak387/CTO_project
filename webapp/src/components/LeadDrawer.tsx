"use client";
import { initials, timeAgo, type Lead } from "@/lib/useLeads";
import { STAGE_LABELS, OUTBOUND_STAGES, INBOUND_STAGES } from "@/lib/stages";
import { LiquidGlass } from "@/components/LiquidGlass";

const EVENT_LABEL: Record<string, string> = {
  ...STAGE_LABELS,
  cancelled: "Booking cancelled",
};

export default function LeadDrawer({
  lead,
  onClose,
  onChanged,
}: {
  lead: Lead;
  onClose: () => void;
  onChanged: () => void;
}) {
  const stages = lead.channel === "inbound" ? INBOUND_STAGES : OUTBOUND_STAGES;

  async function override(stage: string) {
    await fetch("/api/leads/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, stage }),
    });
    onChanged();
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="dh">
          <span className="dtitle">Lead detail</span>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <div className="dpad">
          {/* header */}
          <div className="lead-h">
            <div className="av big">{initials(lead.name)}</div>
            <div>
              <a className="dname" href={lead.linkedinUrl ?? "#"} target="_blank" rel="noreferrer">{lead.name} ↗</a>
              <div className="role">{lead.title} · {lead.company}</div>
              <div className="dbadges">
                <span className={`pill ${lead.channel === "inbound" ? "in" : "out"}`}>
                  {lead.channel === "both" ? "OUT + IN" : lead.channel === "inbound" ? "INBOUND" : "OUTBOUND"}
                </span>
                <span className="pill stagepill">{STAGE_LABELS[lead.stage]}</span>
                {lead.emailSuppressed && <span className="pill mut">Email suppressed</span>}
              </div>
            </div>
          </div>

          {/* primary action — the handoff is "go talk to them on LinkedIn" */}
          <LiquidGlass as="a" className="lg-cta" href={lead.linkedinUrl ?? "#"} target="_blank" rel="noreferrer" tint="rgba(37,99,235,.88)">
            Open LinkedIn profile ↗
          </LiquidGlass>

          {/* contact */}
          <div className="dblk">
            <div className="dblk-h">Contact</div>
            <div className="crow"><span className="cic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></span><span className="clab">LinkedIn</span><span className="cval">{lead.linkedinUrl?.replace("https://", "")}</span></div>
            <div className="crow"><span className="cic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg></span><span className="clab">Email</span><span className="cval">{lead.email}</span></div>
          </div>

          {/* meeting */}
          {lead.meetingAt && (
            <div className="dblk">
              <div className="dblk-h">Meeting</div>
              <div className="meet">
                <div className="cal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg></div>
                <div>
                  <b>{new Date(lead.meetingAt).toLocaleString("en", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</b>
                  <small>Booked via Calendly · using {lead.meetingEmail}</small>
                </div>
              </div>
            </div>
          )}

          {/* timeline */}
          <div className="dblk">
            <div className="dblk-h">Timeline</div>
            <div className="tl">
              {lead.events.map((e, i) => (
                <div className="ti" key={e.id}>
                  <div className={`tdot ${i === lead.events.length - 1 ? "now" : "done"}`}>{i === lead.events.length - 1 ? "●" : "✓"}</div>
                  <div>
                    <div className="tlab">{EVENT_LABEL[e.type] ?? e.type}</div>
                    <div className="ttm">{new Date(e.at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {timeAgo(e.at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* manual override */}
          <div className="dblk">
            <div className="dblk-h">Manage — manual override</div>
            <div className="ovrow">
              <span>Move stage:</span>
              <select className="sel" value={lead.stage} onChange={(e) => override(e.target.value)}>
                {stages.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="ovhint">Use when a webhook misfired and the stage is wrong.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
