"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Post = { id: number; text: string; photoUrl: string | null; isSystem: boolean; createdAt: string; player: { name: string; photoUrl: string | null; team: { color: string } | null } | null };
function relativeTime(value: string) { const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000)); return minutes < 60 ? `před ${minutes} min` : `před ${Math.round(minutes / 60)} h`; }
function postText(text: string) { const question = text.match(/^Otázka:\s*(.*)$/m)?.[1]; const answer = text.match(/^Odpověď:\s*(.*)$/m)?.[1]; if (!question || !answer) return text; return <><span className="post-question-label">Otázka:</span> {question}<br /><span className="post-answer-label">Odpověď:</span> {answer}</>; }
export default function DashboardView() {
  const [posts, setPosts] = useState<Post[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; const load = async () => { const response = await fetch("/api/dashboard", { cache: "no-store" }); if (!response.ok) { if (active) setError("Nástěnku se nepodařilo načíst."); return; } if (active) setPosts((await response.json()).posts); }; void load(); const interval = window.setInterval(load, 8000); return () => { active = false; window.clearInterval(interval); }; }, []);
  return <main className="dashboard-shell"><header className="board-header"><Link className="brand" href="/">✦ Survival <em>Party</em></Link><nav><Link href="/leaderboard">Žebříček</Link><Link href="/game">Vstoupit do hry</Link></nav></header><section className="board-title"><p className="eyebrow"><span /> zprávy z party</p><h1>Nástěnka<br /><i>party.</i></h1><p>Co se právě děje mezi kmeny.</p></section>{error && <p className="board-error">{error}</p>}<section className="feed-list">{posts.length === 0 && !error ? <p className="board-loading">Zatím čekáme na první zprávu…</p> : posts.map((post) => <article className="feed-post" key={post.id}><div className="feed-avatar" style={{ background: post.player?.team?.color ?? "#df633d" }}>{post.isSystem ? "✦" : post.player?.name.slice(0, 1).toUpperCase()}</div><div className="feed-content"><div className="feed-meta"><b>{post.isSystem ? "Organizace" : post.player?.name}</b><time>{relativeTime(post.createdAt)}</time></div><p>{postText(post.text)}</p>{post.photoUrl && <Image src={post.photoUrl} alt="Momentka z party" width={1200} height={800} unoptimized />}</div></article>)}</section></main>;
}
