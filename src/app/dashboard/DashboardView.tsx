"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Post = { id: number; text: string; photoUrl: string | null; isSystem: boolean; createdAt: string; player: { name: string; photoUrl: string | null; team: { color: string } | null } | null };
function relativeTime(value: string) { const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000)); return minutes < 60 ? `před ${minutes} min` : `před ${Math.round(minutes / 60)} h`; }
function postText(text: string) { const question = text.match(/^Otázka:\s*(.*)$/m)?.[1]; const answer = text.match(/^Odpověď:\s*(.*)$/m)?.[1]; if (!question || !answer) return text; return <><span className="post-question-label">Otázka:</span> {question}<br /><span className="post-answer-label">Odpověď:</span> {answer}</>; }
function weightedOrder(posts: Post[]) {
  const remaining = [...posts];
  const ordered: Post[] = [];
  while (remaining.length) {
    const weights = remaining.map((post) => Math.exp(-Math.max(0, Date.now() - new Date(post.createdAt).getTime()) / 86400000 / 3));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = Math.random() * total;
    const selectedIndex = weights.findIndex((weight) => { cursor -= weight; return cursor <= 0; });
    ordered.push(remaining.splice(selectedIndex < 0 ? remaining.length - 1 : selectedIndex, 1)[0]);
  }
  return ordered;
}
export default function DashboardView() {
  const [posts, setPosts] = useState<Post[]>([]); const [newPostIds, setNewPostIds] = useState<number[]>([]); const [error, setError] = useState(""); const loadedOnce = useRef(false);
  useEffect(() => { let active = true; const load = async () => { const response = await fetch("/api/dashboard", { cache: "no-store" }); if (!response.ok) { if (active) setError("Nástěnku se nepodařilo načíst."); return; } const incoming = (await response.json()).posts as Post[]; if (active) { setPosts((current) => { const known = new Set(current.map((post) => post.id)); setNewPostIds(loadedOnce.current ? incoming.filter((post) => !known.has(post.id)).map((post) => post.id) : []); loadedOnce.current = true; return weightedOrder(incoming); }); } }; void load(); const interval = window.setInterval(load, 8000); return () => { active = false; window.clearInterval(interval); }; }, []);
  return <main className="dashboard-shell"><header className="board-header"><Link className="brand" href="/">✦ Survival <em>Party</em></Link><nav><Link href="/leaderboard">Žebříček</Link><Link href="/game">Vstoupit do hry</Link></nav></header><section className="board-title"><p className="eyebrow"><span /> zprávy z party</p><h1>Nástěnka<br /><i>party.</i></h1><p>Co se právě děje mezi kmeny.</p></section>{error && <p className="board-error">{error}</p>}{newPostIds.length > 0 && <div className="dashboard-release">✦ Nově zveřejněno</div>}<section className="feed-list">{posts.length === 0 && !error ? <p className="board-loading">Zatím čekáme na první zprávu…</p> : posts.map((post) => <article className={`feed-post ${post.photoUrl ? "has-photo" : ""} ${newPostIds.includes(post.id) ? "is-new-post" : ""}`} style={post.photoUrl ? { display: "grid", gridTemplateColumns: "52px minmax(0, 45fr) minmax(0, 55fr)", gap: "48px" } : undefined} key={post.id}><div className="feed-avatar" style={{ background: post.player?.team?.color ?? "#df633d" }}>{post.isSystem ? "✦" : post.player?.name.slice(0, 1).toUpperCase()}</div>{post.photoUrl && <div className="feed-photo-frame"><Image className="feed-photo" src={post.photoUrl} alt="Momentka z party" fill sizes="(min-width: 1200px) 45vw, 100vw" unoptimized /></div>}<div className="feed-content" style={post.photoUrl ? { gridColumn: 3, width: "100%" } : undefined}><div className="feed-meta"><b>{post.isSystem ? "Organizace" : post.player?.name}</b><time>{relativeTime(post.createdAt)}</time></div><p style={post.photoUrl ? { fontSize: "32px", lineHeight: 1.3 } : undefined}>{postText(post.text)}</p></div></article>)}</section></main>;
}
