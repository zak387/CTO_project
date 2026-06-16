"use client";
import { initials, timeAgo, type Lead } from "@/lib/useLeads";
import { STAGE_LABELS, OUTBOUND_STAGES, INBOUND_STAGES } from "@/lib/stages";

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
                {lead.emailSuppressed && <span className="pill mut">📧 suppressed</span>}
              </div>
            </div>
          </div>

          {/* contact */}
          <div className="dblk">
            <div className="dblk-h">Contact</div>
            <div className="crow"><span className="cic">🔗</span><span className="clab">LinkedIn</span><span className="cval">{lead.linkedinUrl?.replace("https://", "")}</span></div>
            <div className="crow"><span className="cic">✉️</span><span className="clab">Email</span><span className="cval">{lead.email}</span></div>
          </div>

          {/* meeting */}
          {lead.meetingAt && (
            <div className="dblk">
              <div className="dblk-h">Meeting</div>
              <div className="meet">
                <div className="cal">📅</div>
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
