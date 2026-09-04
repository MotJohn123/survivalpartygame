"use client";

import { FormEvent, useEffect, useState } from "react";

type Voting = { id: number; question: string; voteType: string; isActive: boolean; _count: { responses: number } };
export default function AdminVoting() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");
  async function load() { const response = await fetch("/api/admin/voting", { cache: "no-store" }); if (response.ok) setVotings((await response.json()).votings); }
  useEffect(() => { let active = true; void fetch("/api/admin/voting", { cache: "no-store" }).then(async (response) => { if (active && response.ok) setVotings((await response.json()).votings); }); return () => { active = false; }; }, []);
  async function create(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/admin/voting", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, voteType: "YES_NO", scope: "ALL" }) }); setMessage(response.ok ? "Hlasování spuštěno." : "Hlasování se nepodařilo vytvořit."); if (response.ok) { setQuestion(""); await load(); } }
  async function close(id: number) { await fetch(`/api/admin/voting/${id}/close`, { method: "PATCH" }); await load(); }
  return <section className="admin-voting"><div className="admin-section-heading"><div><p className="eyebrow"><span /> rozhodnutí kmene</p><h2>Hlasování<br /><i>v táboře.</i></h2></div><p className="admin-message">{message}</p></div><form className="voting-admin-form" onSubmit={create}><input placeholder="Na co se má kmen zeptat?" value={question} onChange={(event) => setQuestion(event.target.value)} /><button type="submit">Spustit ano / ne</button></form><div className="admin-voting-list">{votings.map((voting) => <article key={voting.id}><div><b>{voting.question}</b><small>{voting.isActive ? "Aktivní" : "Uzavřené"} · {voting._count.responses} hlasů</small></div>{voting.isActive && <button type="button" onClick={() => void close(voting.id)}>Zavřít hlasování</button>}</article>)}</div></section>;
}
