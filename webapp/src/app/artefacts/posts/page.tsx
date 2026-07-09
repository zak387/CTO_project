"use client";
import { Fragment, useEffect, useState, useCallback } from "react";
import { LiquidGlass } from "@/components/LiquidGlass";

type Post = {
  id: number; hook: string; body: string; scheduledDate: string;
  status: string; note: string | null; approved: boolean;
};

const CELL_LABEL: Record<string, string> = { draft: "DRAFT", scheduled: "SCHEDULED", live: "LIVE" };
const DOW = [2, 3, 4]; // Tue, Wed, Thu

function weekStart(iso: string) {
  const x = new Date(iso);
  const off = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - off);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function PostsCalendar() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [draftBody, setDraftBody] = useState("");

  const refresh = useCallback(async () => {
    const r = await fetch("/api/posts", { cache: "no-store" });
    const d = await r.json();
    setPosts(d.posts);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const sorted = [...posts].sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));
  const sel = posts.find((p) => p.id === selId) ?? null;
  const idx = sel ? sorted.findIndex((p) => p.id === sel.id) : -1;
  function open(p: Post) { setSelId(p.id); setDraftBody(p.body); }

  async function save(extra: Partial<Post> = {}) {
    if (!sel) return;
    await fetch("/api/posts/update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sel.id, body: draftBody, ...extra }),
    });
    await refresh();
  }

  // group into weeks
  const weeks: { key: number; label: string; slots: (Post | null)[] }[] = [];
  for (const p of sorted) {
    const ws = weekStart(p.scheduledDate);
    const key = ws.getTime();
    let w = weeks.find((x) => x.key === key);
    if (!w) {
      w = { key, label: ws.toLocaleDateString("en", { month: "short", day: "numeric" }), slots: [null, null, null] };
      weeks.push(w);
    }
    const slot = DOW.indexOf(new Date(p.scheduledDate).getDay());
    if (slot >= 0) w.slots[slot] = p;
  }
  weeks.sort((a, b) => a.key - b.key);

  return (
    <>
      <div className="top">
        <div className="t-stagger">
          <div className="crumb">Artefacts / Posts</div>
          <h1 className="t-stagger-line t-stagger-line--1">LinkedIn posts</h1>
          <div className="sub t-stagger-line t-stagger-line--2">Adam&apos;s content, 3× / week. Click a post to read, edit, or approve.</div>
        </div>
        <LiquidGlass className="countdown" tint="rgba(255,255,255,.5)"><b>{posts.length}</b><span>posts · 3× / week</span></LiquidGlass>
      </div>

      {/* calendar */}
      <div className="cal">
        <div className="colhdr"></div>
        <div className="colhdr">Tue</div><div className="colhdr">Wed</div><div className="colhdr">Thu</div>
        {weeks.map((w) => (
          <Fragment key={w.key}>
            <div className="wklbl">{w.label}</div>
            {w.slots.map((p, i) => p ? (
              <div key={i} className={`acell ${p.status === "draft" ? "draft" : ""} ${selId === p.id ? "sel" : ""}`} onClick={() => open(p)}>
                <div className="dnum">{new Date(p.scheduledDate).toLocaleDateString("en", { weekday: "short" }).toUpperCase()} {new Date(p.scheduledDate).getDate()}</div>
                <div className="hk">{p.hook}</div>
                <span className={`abadge ast-${p.status}`}>{CELL_LABEL[p.status]}</span>
              </div>
            ) : <div key={i} className="acell empty">+ add post</div>)}
          </Fragment>
        ))}
      </div>

      <div className="legend">
        <span><span className="abadge ast-live">LIVE</span> posted</span>
        <span><span className="abadge ast-scheduled">SCHEDULED</span> approved &amp; queued</span>
        <span><span className="abadge ast-draft">DRAFT</span> needs Adam&apos;s review</span>
        <span className="legamber">amber outline = needs your review</span>
      </div>

      {/* side panel */}
      {sel && (
        <div className="backdrop" onClick={() => setSelId(null)}>
          <div className="drawer ppanel" onClick={(e) => e.stopPropagation()}>
            <div className="pp-top">
              <div>
                <div className="pphk">{sel.hook}</div>
                <div className="ppmeta">{new Date(sel.scheduledDate).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })} · LinkedIn</div>
              </div>
              <div className="pp-topr">
                <span className={`abadge ast-${sel.status}`}>{CELL_LABEL[sel.status]}</span>
                <button className="x" onClick={() => setSelId(null)}>✕</button>
              </div>
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

            <div className="pp-body">
              <div className="field-lbl">Post body — edit, then Save{sel.approved && <span className="reviewed-flag">✓ Approved</span>}</div>
              <textarea className="post-text" value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
              {sel.note && <div className="pp-note">SAWA note: {sel.note}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
