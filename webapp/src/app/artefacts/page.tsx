"use client";
import { useEffect, useState, useCallback } from "react";

type Post = {
  id: number; hook: string; body: string; scheduledDate: string;
  status: string; note: string | null; approved: boolean;
};

const STATUS_LABEL: Record<string, string> = { draft: "✎ Draft", scheduled: "◷ Scheduled", live: "● Live" };

export default function Artefacts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draftBody, setDraftBody] = useState("");

  const refresh = useCallback(async () => {
    const r = await fetch("/api/posts", { cache: "no-store" });
    const d = await r.json();
    setPosts(d.posts);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  function toggle(p: Post) {
    if (openId === p.id) { setOpenId(null); }
    else { setOpenId(p.id); setDraftBody(p.body); }
  }

  async function save(p: Post, extra: Partial<Post> = {}) {
    await fetch("/api/posts/update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, body: draftBody, ...extra }),
    });
    await refresh();
  }

  const sorted = [...posts].sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));

  return (
    <>
      <div className="top"><div>
        <h1>Artefacts</h1>
        <div className="sub">LinkedIn content — 3 posts a week. Click a post to read, edit, or approve it.</div>
      </div></div>

      <div className="alist">
        {sorted.map((p) => {
          const open = openId === p.id;
          const d = new Date(p.scheduledDate);
          return (
            <div className={`acard2 ${p.status} ${open ? "open" : ""}`} key={p.id}>
              {/* header — click to expand/collapse */}
              <div className="acard2-head" onClick={() => toggle(p)}>
                <div className="acard2-date">
                  <b>{d.toLocaleDateString("en", { day: "numeric" })}</b>
                  <span>{d.toLocaleDateString("en", { month: "short" })}</span>
                </div>
                <div className="acard2-hook">
                  {p.hook}
                  {!open && <span className="acard2-prev">{p.body.slice(0, 90)}…</span>}
                </div>
                <span className={`ast ast-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                {p.approved && <span className="appok">✓</span>}
                <span className="chev">{open ? "▾" : "▸"}</span>
              </div>

              {/* expanded — edit + approve, right here on the card */}
              {open && (
                <div className="acard2-body">
                  <textarea className="ptext" value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
                  <div className="acard2-actions">
                    <button className="btn acc" onClick={() => save(p)}>Save edits</button>
                    <button className="btn green" onClick={() => save(p, { approved: true, status: "scheduled" })}>✓ Approve</button>
                    <span className="acard2-status">
                      {["draft", "scheduled", "live"].map((s) => (
                        <button key={s} className={`btn ${p.status === s ? "acc" : ""}`} onClick={() => save(p, { status: s })}>
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
