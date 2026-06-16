"use client";
import { useState } from "react";
import { useLeads, type Lead } from "@/lib/useLeads";
import { STAGE_LABELS } from "@/lib/stages";

const NEXT_OUT: Record<string, string> = {
  connection_sent: "connected",
  connected: "message_sent",
  message_sent: "replied",
};

export default function Simulator() {
  const { leads, refresh } = useLeads(1500);
  const [log, setLog] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", company: "", email: "", title: "CTO" });

  const say = (m: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l].slice(0, 40));

  async function post(url: string, body: unknown, label: string) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    say(`${label} → ${JSON.stringify(data)}`);
    await refresh();
  }

  const fireDripify = (l: Lead, event: string) =>
    post("/api/webhooks/dripify", { event, linkedin_url: l.linkedinUrl, name: l.name, company: l.company }, `Dripify: ${l.name} ${event}`);

  // Adam sends his OWN Calendly link. The booking arrives with a (possibly
  // different) personal email + the Company from the booking form. We match by
  // email, then company + name — no hidden id. (See SPEC.md §6–7.)
  const book = (l: Lead) =>
    post("/api/webhooks/calendly", {
      event: "booking_created",
      invitee_email: l.name.toLowerCase().split(" ")[0] + ".personal@gmail.com",
      name: l.name,
      company: l.company,
      start_time: new Date(Date.now() + 2 * 86400000).toISOString(),
    }, `Calendly: book ${l.name}`);

  const cancel = (l: Lead) =>
    post("/api/webhooks/calendly", { event: "booking_canceled", invitee_email: l.email, name: l.name, company: l.company }, `Calendly: cancel ${l.name}`);

  const advanceable = leads.filter((l) => l.channel !== "inbound" && NEXT_OUT[l.stage]);
  const repliedLeads = leads.filter((l) => l.stage === "replied");
  const bookedLeads = leads.filter((l) => l.stage === "booked");

  return (
    <>
      <div className="top">
        <div>
          <h1>⚡ Event Simulator</h1>
          <div className="sub">Fire the exact payloads Dripify &amp; Calendly will send. Watch Briefing &amp; Pipeline update live.</div>
        </div>
        <button className="btn ghost" onClick={() => post("/api/reset", {}, "Reset demo data")}>↺ Reset demo data</button>
      </div>

      <div className="simgrid">
        {/* DRIPIFY */}
        <div className="simcard">
          <h3>🔗 Dripify — advance outbound leads</h3>
          <p>Each click fires the next LinkedIn event for that lead and moves their card.</p>
          {advanceable.length === 0 ? (
            <div className="empty">Every outbound lead has already reached Replied.</div>
          ) : advanceable.map((l) => {
            const next = NEXT_OUT[l.stage];
            const followups = l.events.filter((e) => e.type === "message_sent").length;
            return (
              <div className="simrow" key={l.id}>
                <div className="who2">{l.name}
                  <small>now: {STAGE_LABELS[l.stage]}{l.stage === "message_sent" ? ` · ${followups} follow-up${followups === 1 ? "" : "s"}` : ""}</small>
                </div>
                {l.stage === "message_sent" && (
                  <button className="btn ghost" onClick={() => fireDripify(l, "message_sent")}>＋ Follow-up</button>
                )}
                <button className="btn acc" onClick={() => fireDripify(l, next)}>▶ {STAGE_LABELS[next]}</button>
              </div>
            );
          })}
        </div>

        {/* CALENDLY + INBOUND */}
        <div className="simcard">
          <h3>📅 Calendly — book / cancel</h3>
          <p>Adam sends his own link. Booking arrives with a personal email + company → matched by company + name (no tagged link).</p>
          {repliedLeads.map((l) => (
            <div className="simrow" key={l.id}>
              <div className="who2">{l.name}<small>{l.company}</small></div>
              <button className="btn green" onClick={() => book(l)}>📅 Book call</button>
            </div>
          ))}
          {bookedLeads.map((l) => (
            <div className="simrow" key={l.id}>
              <div className="who2">{l.name}<small>booked</small></div>
              <button className="btn" onClick={() => cancel(l)}>⊘ Cancel</button>
            </div>
          ))}

          <h3 style={{ marginTop: 18 }}>🌱 Landing page — new inbound signup</h3>
          <p>Creates a brand-new inbound lead (the list grows).</p>
          <div className="simrow">
            <input className="btn" style={{ flex: 1, fontWeight: 400 }} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="btn" style={{ flex: 1, fontWeight: 400 }} placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="simrow">
            <input className="btn" style={{ flex: 1, fontWeight: 400 }} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <button className="btn acc" onClick={() => {
              if (!form.name || !form.email) return say("Need at least name + email");
              post("/api/leads/inbound", { ...form, linkedin_url: "https://linkedin.com/in/" + form.name.toLowerCase().replace(/[^a-z]+/g, "-") }, `Inbound signup: ${form.name}`);
              setForm({ name: "", company: "", email: "", title: "CTO" });
            }}>＋ Sign up</button>
          </div>
        </div>
      </div>

      <div className="log">
        {log.length === 0 ? <div>— fire an event to see the reconciliation result —</div> : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </>
  );
}
