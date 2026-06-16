"use client";
import { useEffect, useState, useCallback } from "react";

type Post = {
  id: number; hook: string; body: string; scheduledDate: string;
  status: string; note: string | null; approved: boolean;
};

const STATUS_LABEL: Record<string, string> = { draft: "✎ Draft", scheduled: "◷ Scheduled", live: "● Live" };
const DOW = [1, 3, 5]; // Mon, Wed, Fri
const DOW_LABEL = ["Mon", "Wed", "Fri"];

function weekStart(iso: string) {
  const x = new Date(iso);
  const off = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - off);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Artefacts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [editing, setEditing] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/posts", { cache: "no-store" });
    const d = await r.json();
    setPosts(d.posts);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const sel = posts.find((p) => p.id === selId) ?? null;
  const idx = sel ? posts.findIndex((p) => p.id === sel.id) : -1;
  function open(p: Post) { setSelId(p.id); setDraftBody(p.body); setEditing(false); }

  async function save(extra: Partial<Post> = {}) {
    if (!sel) return;
    await fetch("/api/posts/update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sel.id, body: draftBody, ...extra }),
    });
    setEditing(false);
    await refresh();
  }

  const weeks: { key: number; label: string; slots: (Post | null)[] }[] = [];
  for (const p of posts) {
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
      <div className="top"><div>
        <h1>Artefacts</h1>
        <div className="sub">LinkedIn content — 3 posts a week (Mon · Wed · Fri). Click a post to read it.</div>
      </div></div>

      {/* calendar grid — always visible */}
      <div className="agrid">
        <div className="ahead"></div>
        {DOW_LABEL.map((d) => <div className="ahead" key={d}>{d}</div>)}
        {weeks.map((w) => (
          <div key={w.key} style={{ display: "contents" }}>
            <div className="awklabel">Week of<br /><b>{w.label}</b></div>
            {w.slots.map((p, i) => p ? (
              <div key={i} className={`acell ${p.status} ${selId === p.id ? "sel" : ""}`} onClick={() => open(p)}>
                <div className="acelldate">{new Date(p.scheduledDate).toLocaleDateString("en", { month: "short", day: "numeric" })}</div>
                <div className="acellhook">{p.hook}</div>
                <span className={`ast ast-${p.status}`}>{STATUS_LABEL[p.status]}</span>
              </div>
            ) : <div key={i} className="acell empty-cell">+ add post</div>)}
          </div>
        ))}
      </div>

      {/* reader — full width, in the page flow, below the calendar (no pop-up) */}
      {sel && (
        <section className="card postreader">
          <div className="prhead">
            <div>
              <span className={`ast ast-${sel.status}`}>{STATUS_LABEL[sel.status]}</span>
              <h2 className="prtitle">{sel.hook}</h2>
              <div className="prmeta">
                📅 {new Date(sel.scheduledDate).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
                {sel.approved && <span className="appok">✓ approved</span>}
                <span className="prcount"> · post {idx + 1} of {posts.length}</span>
              </div>
            </div>
            <button className="btn" onClick={() => setSelId(null)}>✕ Close</button>
          </div>

          {editing ? (
            <textarea className="ptext" value={draftBody} onChange={(e) => setDraftBody(e.target.value)} autoFocus />
          ) : (
            <p className="artbody">{sel.body}</p>
          )}

          <div className="prfoot">
            <div className="prnav">
              <button className="btn" disabled={idx <= 0} onClick={() => open(posts[idx - 1])}>‹ Prev</button>
              <button className="btn" disabled={idx >= posts.length - 1} onClick={() => open(posts[idx + 1])}>Next ›</button>
            </div>
            <div className="pactions">
              {editing ? (
                <>
                  <button className="btn acc" onClick={() => save()}>Save</button>
                  <button className="btn" onClick={() => { setDraftBody(sel.body); setEditing(false); }}>Cancel</button>
                </>
              ) : (
                <>
                  {["draft", "scheduled", "live"].map((s) => (
                    <button key={s} className={`btn ${sel.status === s ? "acc" : ""}`} onClick={() => save({ status: s })}>
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                  <button className="btn" onClick={() => setEditing(true)}>✎ Edit</button>
                  <button className="btn green" onClick={() => save({ approved: true })}>✓ Approve</button>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
