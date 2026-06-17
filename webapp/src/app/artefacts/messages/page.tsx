"use client";
import { useEffect, useState, useCallback } from "react";
import { LiquidGlass } from "@/components/LiquidGlass";

type Message = {
  id: number; channel: string; label: string; step: number; meta: string | null;
  subject: string | null; body: string; status: string; note: string | null; approved: boolean;
};

const STATUS_LABEL: Record<string, string> = { needs_review: "NEEDS REVIEW", scheduled: "SCHEDULED", live: "LIVE" };
const STATUS_BADGE: Record<string, string> = { needs_review: "ast-draft", scheduled: "ast-scheduled", live: "ast-live" };
const CHANNEL_ORDER: Record<string, number> = { linkedin: 0, email: 1 };
const CHANNEL_TITLE: Record<string, string> = { linkedin: "LinkedIn sequence", email: "Email follow-ups" };
const CHANNEL_SUB: Record<string, string> = { linkedin: "via Dripify", email: "bulk nudges" };

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);

export default function OutreachMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftSubject, setDraftSubject] = useState("");

  const refresh = useCallback(async () => {
    const r = await fetch("/api/messages", { cache: "no-store" });
    const d = await r.json();
    setMessages(d.messages);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const sorted = [...messages].sort(
    (a, b) => (CHANNEL_ORDER[a.channel] - CHANNEL_ORDER[b.channel]) || (a.step - b.step)
  );
  const reviewCount = messages.filter((m) => m.status === "needs_review").length;
  const sel = messages.find((m) => m.id === selId) ?? null;
  const idx = sel ? sorted.findIndex((m) => m.id === sel.id) : -1;

  function open(m: Message) { setSelId(m.id); setDraftBody(m.body); setDraftSubject(m.subject ?? ""); }

  async function save(extra: Partial<Message> = {}) {
    if (!sel) return;
    await fetch("/api/messages/update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sel.id, body: draftBody, subject: sel.channel === "email" ? draftSubject : undefined, ...extra }),
    });
    await refresh();
  }

  // group by channel, preserving the sorted order
  const groups: { channel: string; items: Message[] }[] = [];
  for (const m of sorted) {
    let g = groups.find((x) => x.channel === m.channel);
    if (!g) { g = { channel: m.channel, items: [] }; groups.push(g); }
    g.items.push(m);
  }

  return (
    <>
      <div className="top">
        <div className="t-stagger">
          <div className="crumb">Artefacts / LinkedIn messages</div>
          <h1 className="t-stagger-line t-stagger-line--1">LinkedIn messages</h1>
          <div className="sub t-stagger-line t-stagger-line--2">The messages that go out to leads. Approve what&apos;s waiting; edit any of them if you need to.</div>
        </div>
      </div>

      <div className="reviewstrip">
        <span className="big">{reviewCount}</span>
        <span className="lbl">{reviewCount === 1 ? "message awaits" : "messages await"} your approval — they won&apos;t send until you approve.</span>
      </div>

      {groups.map((g) => (
        <div key={g.channel}>
          <div className="seqhdr">
            <span className="seqic">{g.channel === "linkedin" ? <LinkedInIcon /> : <MailIcon />}</span>
            {CHANNEL_TITLE[g.channel] ?? g.channel} <span className="seqsub">{CHANNEL_SUB[g.channel]}</span>
          </div>
          {g.items.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.status === "needs_review" ? "review" : ""} ${selId === m.id ? "sel" : ""}`}
              onClick={() => open(m)}
            >
              <div className="msg-h">
                <span className="name">{m.label}</span>
                {m.meta && <span className="meta">· {m.meta}</span>}
                <span className={`abadge ${STATUS_BADGE[m.status]}`} style={{ marginLeft: "auto" }}>{STATUS_LABEL[m.status]}</span>
              </div>
              {m.subject && <div className="msubject">Subject: {m.subject}</div>}
              <div className="mbody">{m.body}</div>
              {m.status === "needs_review" && (
                <div className="msg-foot">
                  <span className="hint">Click to edit — or approve as-is.</span>
                  <div className="pp-actions" style={{ marginLeft: "auto" }}>
                    <LiquidGlass
                      as="button"
                      className="pbtn primary"
                      tint="rgba(14,159,110,.88)"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); open(m); }}
                    >Review &amp; approve</LiquidGlass>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* edit / save / approve panel — same mechanism as the posts calendar */}
      {sel && (
        <div className="backdrop" onClick={() => setSelId(null)}>
          <div className="drawer ppanel" onClick={(e) => e.stopPropagation()}>
            <div className="pp-top">
              <div>
                <div className="pphk">{sel.label}</div>
                <div className="ppmeta">{sel.channel === "linkedin" ? "LinkedIn" : "Email"}{sel.meta ? ` · ${sel.meta}` : ""}</div>
              </div>
              <div className="pp-topr">
                <span className={`abadge ${STATUS_BADGE[sel.status]}`}>{STATUS_LABEL[sel.status]}</span>
                <button className="x" onClick={() => setSelId(null)}>✕</button>
              </div>
            </div>

            <div className="pp-body">
              {sel.channel === "email" && (
                <>
                  <div className="field-lbl">Subject line</div>
                  <input className="subject-input" value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} />
                </>
              )}
              <div className="field-lbl" style={{ marginTop: sel.channel === "email" ? 16 : 0 }}>
                Message — edit, then Save{sel.approved && <span className="reviewed-flag">✓ Approved</span>}
              </div>
              <textarea className="post-text" value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
              {sel.note && <div className="pp-note">SAWA note: {sel.note}</div>}
            </div>

            <div className="pp-foot">
              <div className="walk">
                <button className="arrow" disabled={idx <= 0} onClick={() => open(sorted[idx - 1])}>‹</button>
                {idx + 1} of {sorted.length}
                <button className="arrow" disabled={idx >= sorted.length - 1} onClick={() => open(sorted[idx + 1])}>›</button>
              </div>
              <div className="pp-actions">
                <button className="pbtn" onClick={() => save()}>Save</button>
                <LiquidGlass as="button" className="pbtn primary" tint="rgba(14,159,110,.88)" onClick={() => save({ approved: true, status: "scheduled" })}>✓ Approve</LiquidGlass>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
