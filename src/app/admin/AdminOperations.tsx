"use client";

import { FormEvent, useEffect, useState } from "react";

type Team = { id: number; name: string; color: string | null; players: Player[] };
type Player = { id: number; name: string; points: number; teamId: number | null };

export default function AdminOperations() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamColor, setTeamColor] = useState("#df633d");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function load() { const response = await fetch("/api/admin/teams", { cache: "no-store" }); if (response.ok) { const data = await response.json(); setTeams(data.teams); setPlayers(data.players); } }
  useEffect(() => { let active = true; void fetch("/api/admin/teams", { cache: "no-store" }).then(async (response) => { if (active && response.ok) { const data = await response.json(); setTeams(data.teams); setPlayers(data.players); } }); return () => { active = false; }; }, []);

  async function createTeam(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch("/api/admin/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: teamName, color: teamColor }) }); const data = await response.json(); setMessage(response.ok ? "Tým vytvořen." : data.error); if (response.ok) { setTeamName(""); await load(); } }
  async function assignPlayer(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await fetch("/api/admin/teams", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: Number(selectedPlayer), teamId: selectedTeam || null }) }); setMessage("Přiřazení uloženo."); await load(); }
  async function adjustPoints(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch("/api/admin/points/adjust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerIds: [Number(selectedPlayer)], points: Number(points), reason }) }); const data = await response.json(); setMessage(response.ok ? `Body upraveny u ${data.updated} hráče.` : data.error); if (response.ok) { setPoints(""); await load(); } }

  return <section className="admin-operations"><div className="admin-section-heading"><div><p className="eyebrow"><span /> lidé a kmeny</p><h2>Správa<br /><i>tábora.</i></h2></div>{message && <p className="admin-message">{message}</p>}</div><div className="admin-ops-grid"><form className="admin-operation-card" onSubmit={createTeam}><h3>Nový tým</h3><input placeholder="Název týmu" value={teamName} onChange={(event) => setTeamName(event.target.value)} /><label>Barva <input type="color" value={teamColor} onChange={(event) => setTeamColor(event.target.value)} /></label><button type="submit">Vytvořit tým</button></form><form className="admin-operation-card" onSubmit={assignPlayer}><h3>Přiřadit hráče</h3><select value={selectedPlayer} onChange={(event) => setSelectedPlayer(event.target.value)}><option value="">Vyber hráče</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)}><option value="">Bez týmu</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button type="submit">Uložit tým</button></form><form className="admin-operation-card" onSubmit={adjustPoints}><h3>Upravit body</h3><select value={selectedPlayer} onChange={(event) => setSelectedPlayer(event.target.value)}><option value="">Vyber hráče</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.points} b.</option>)}</select><input type="number" placeholder="+ / - body" value={points} onChange={(event) => setPoints(event.target.value)} /><input placeholder="Důvod" value={reason} onChange={(event) => setReason(event.target.value)} /><button type="submit">Připsat / odečíst</button></form></div><div className="team-summary">{teams.map((team) => <div key={team.id}><span style={{ background: team.color ?? "#df633d" }} /><b>{team.name}</b><small>{team.players.length} hráčů</small></div>)}</div></section>;
}
