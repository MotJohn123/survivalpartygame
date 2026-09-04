"use client";

import { FormEvent, useEffect, useState } from "react";

type Post = { id: number; text: string; isSystem: boolean; createdAt: string; player: { name: string } | null };
export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]); const [text, setText] = useState(""); const [message, setMessage] = useState("");
  async function load() { const response = await fetch("/api/admin/dashboard", { cache: "no-store" }); if (response.ok) setPosts((await response.json()).posts); }
  useEffect(() => { let active = true; void fetch("/api/admin/dashboard", { cache: "no-store" }).then(async (response) => { if (active && response.ok) setPosts((await response.json()).posts); }); return () => { active = false; }; }, []);
  async function publish(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/admin/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); setMessage(response.ok ? "Příspěvek zveřejněn." : (await response.json()).error); if (response.ok) { setText(""); await load(); } }
  async function remove(id: number) { await fetch(`/api/admin/dashboard/${id}`, { method: "DELETE" }); await load(); }
  return <section className="admin-dashboard"><div className="admin-section-heading"><div><p className="eyebrow"><span /> hlas tábora</p><h2>Nástěnka<br /><i>v pohybu.</i></h2></div><p className="admin-message">{message}</p></div><form className="dashboard-admin-form" onSubmit={publish}><textarea placeholder="Co se právě děje?" value={text} onChange={(event) => setText(event.target.value)} /><button type="submit">Zveřejnit příspěvek</button></form><div className="admin-post-list">{posts.map((post) => <article key={post.id}><div><b>{post.isSystem ? "Táborový hlas" : post.player?.name}</b><p>{post.text}</p></div><button type="button" onClick={() => void remove(post.id)}>Smazat</button></article>)}</div></section>;
}
