"use client";

import { useEffect, useState } from "react";

type Voting = { id: number; question: string; voteType: "YES_NO" | "MULTIPLE_CHOICE" | "PLAYER_SELECT"; options: { id: number; text: string }[]; candidates: { id: number; name: string; team: { name: string; color: string | null } | null }[]; hasVoted: boolean };

export default function VotingPanel() {
  const [voting, setVoting] = useState<Voting | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { let active = true; const load = async () => { const response = await fetch("/api/voting/active", { cache: "no-store" }); if (active && response.ok) setVoting((await response.json()).voting); }; void load(); const interval = window.setInterval(load, 7000); return () => { active = false; window.clearInterval(interval); }; }, []);
  if (!voting) return null;
  async function vote(answer: string) { setSending(true); setError(""); const response = await fetch(`/api/voting/${voting?.id}/respond`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }) }); const result = await response.json(); setSending(false); if (!response.ok) { setError(result.error); return; } setVoting({ ...voting!, hasVoted: true }); setMessage("Děkujeme, tvůj hlas byl zaznamenán."); }
  return <section className="voting-panel"><p className="eyebrow"><span /> kmenová rada</p><h2>{voting.question}</h2>{voting.hasVoted || message ? <p className="vote-success">{message || "Děkujeme, tvůj hlas byl zaznamenán."}</p> : <div className="vote-options">{voting.voteType === "YES_NO" && <><button disabled={sending} onClick={() => void vote("yes")}>Ano</button><button disabled={sending} onClick={() => void vote("no")}>Ne</button></>}{voting.voteType === "MULTIPLE_CHOICE" && voting.options.map((option) => <button disabled={sending} key={option.id} onClick={() => void vote(String(option.id))}>{option.text}</button>)}{voting.voteType === "PLAYER_SELECT" && voting.candidates.map((candidate) => <button disabled={sending} key={candidate.id} onClick={() => void vote(String(candidate.id))}>{candidate.name}</button>)}</div>}{error && <p className="task-error">{error}</p>}</section>;
}
