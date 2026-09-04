"use client";

import { useEffect, useState } from "react";

type Round = { id: number; title: string | null; rewardPoints: number; isOpen: boolean; isResolved: boolean; teamA: { name: string; color: string | null }; teamB: { name: string; color: string | null }; candidates: { id: number; name: string; team: { name: string; color: string | null } | null }[]; betCandidateId: number | null; winnerIds: number[] };
export default function BettingPanel() {
  const [round, setRound] = useState<Round | null>(null); const [message, setMessage] = useState("");
  async function load() { const response = await fetch("/api/betting/active", { cache: "no-store" }); if (response.ok) setRound((await response.json()).round); }
  useEffect(() => { let active = true; void fetch("/api/betting/active", { cache: "no-store" }).then(async (response) => { if (active && response.ok) setRound((await response.json()).round); }); const interval = window.setInterval(load, 8000); return () => { active = false; window.clearInterval(interval); }; }, []);
  if (!round) return null;
  async function bet(candidatePlayerId: number, candidateName: string) { const response = await fetch(`/api/betting/${round!.id}/bet`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidatePlayerId }) }); setMessage(response.ok ? `Vsadil/a jsi na: ${candidateName}` : (await response.json()).error); if (response.ok) await load(); }
  return <section className="betting-panel"><p className="eyebrow"><span /> sázky</p><h2>{round.title ?? `${round.teamA.name} vs. ${round.teamB.name}`}</h2><p className="betting-reward">Správný tip získá <b>+{round.rewardPoints} bodů</b></p>{round.isResolved ? <p className="vote-success">Výsledek je znám. {round.winnerIds.length} vítězní hráči byli vyhodnoceni.</p> : !round.isOpen ? <p className="betting-closed">Sázky jsou uzavřené, výsledek brzy.</p> : <div className="bet-candidates">{round.candidates.map((candidate) => <button className={round.betCandidateId === candidate.id ? "selected" : ""} key={candidate.id} onClick={() => void bet(candidate.id, candidate.name)}>{candidate.name}<small>{candidate.team?.name}</small></button>)}</div>}{message && <p className="task-success">{message}</p>}</section>;
}
