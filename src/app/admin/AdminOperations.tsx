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
  const [teamPoints, setTeamPoints] = useState("");
  const [teamReason, setTeamReason] = useState("");
  const [message, setMessage] = useState("");
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const response = await fetch("/api/admin/teams", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setTeams(data.teams);
      setPlayers(data.players);
    }
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/teams", { cache: "no-store" }).then(async (response) => {
      if (active && response.ok) {
        const data = await response.json();
        setTeams(data.teams);
        setPlayers(data.players);
      }
    });
    return () => { active = false; };
  }, []);

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: teamName, color: teamColor }) });
    const data = await response.json();
    setMessage(response.ok ? "Tým vytvořen." : data.error);
    if (response.ok) { setTeamName(""); await load(); }
  }

  async function assignPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/teams", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: Number(selectedPlayer), teamId: selectedTeam || null }) });
    setMessage(response.ok ? "Přiřazení uloženo." : (await response.json()).error);
    await load();
  }

  async function adjustPoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/points/adjust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerIds: [Number(selectedPlayer)], points: Number(points), reason }) });
    const data = await response.json();
    setMessage(response.ok ? `Body upraveny u ${data.updated} hráče.` : data.error);
    if (response.ok) { setPoints(""); await load(); }
  }

  async function adjustTeamPoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/points/adjust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: Number(selectedTeam), points: Number(teamPoints), reason: teamReason }) });
    const data = await response.json();
    setMessage(response.ok ? `Body upraveny u ${data.updated} hráčů.` : data.error);
    if (response.ok) { setTeamPoints(""); await load(); }
  }

  async function saveTeam(team: Team) {
    const response = await fetch(`/api/admin/teams/${team.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName, color: team.color }) });
    setMessage(response.ok ? "Název týmu upraven." : (await response.json()).error);
    setEditingTeam(null);
    await load();
  }

  async function deleteTeam(team: Team) {
    if (!window.confirm(`Opravdu smazat tým ${team.name}? Hráči zůstanou bez týmu.`)) return;
    const response = await fetch(`/api/admin/teams/${team.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Tým smazán." : (await response.json()).error);
    await load();
  }

  async function savePlayer(player: Player) {
    const response = await fetch(`/api/admin/players/${player.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
    setMessage(response.ok ? "Jméno hráče upraveno." : (await response.json()).error);
    setEditingPlayer(null);
    await load();
  }

  async function deletePlayer(player: Player) {
    if (!window.confirm(`Opravdu smazat hráče ${player.name}? Jeho historie bude odstraněna.`)) return;
    const response = await fetch(`/api/admin/players/${player.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Hráč smazán." : (await response.json()).error);
    await load();
  }

  return (
    <section className="admin-operations">
      <div className="admin-section-heading"><div><p className="eyebrow"><span /> lidé a kmeny</p><h2>Správa<br /><i>tábora.</i></h2></div>{message && <p className="admin-message">{message}</p>}</div>
      <div className="admin-ops-grid">
        <form className="admin-operation-card" onSubmit={createTeam}><h3>Nový tým</h3><input placeholder="Název týmu" value={teamName} onChange={(event) => setTeamName(event.target.value)} /><label>Barva <input type="color" value={teamColor} onChange={(event) => setTeamColor(event.target.value)} /></label><button type="submit">Vytvořit tým</button></form>
        <form className="admin-operation-card" onSubmit={assignPlayer}><h3>Přiřadit hráče</h3><select value={selectedPlayer} onChange={(event) => setSelectedPlayer(event.target.value)}><option value="">Vyber hráče</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)}><option value="">Bez týmu</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button type="submit">Uložit tým</button></form>
        <form className="admin-operation-card" onSubmit={adjustPoints}><h3>Body hráči</h3><select value={selectedPlayer} onChange={(event) => setSelectedPlayer(event.target.value)}><option value="">Vyber hráče</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.points} b.</option>)}</select><input type="number" placeholder="+ / - body" value={points} onChange={(event) => setPoints(event.target.value)} /><input placeholder="Důvod" value={reason} onChange={(event) => setReason(event.target.value)} /><button type="submit">Připsat / odečíst</button></form>
        <form className="admin-operation-card" onSubmit={adjustTeamPoints}><h3>Body celému týmu</h3><select value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)}><option value="">Vyber tým</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name} · {team.players.length} hráčů</option>)}</select><input type="number" placeholder="+ / - body" value={teamPoints} onChange={(event) => setTeamPoints(event.target.value)} /><input placeholder="Důvod" value={teamReason} onChange={(event) => setTeamReason(event.target.value)} /><button type="submit">Upravit celý tým</button></form>
      </div>
      <div className="admin-directory"><div><h3>Týmy</h3>{teams.map((team) => <article key={team.id}><span className="directory-color" style={{ background: team.color ?? "#df633d" }} />{editingTeam === team.id ? <input className="directory-edit" value={editName} onChange={(event) => setEditName(event.target.value)} /> : <b>{team.name}</b>}<small>{team.players.length} hráčů</small>{editingTeam === team.id ? <button type="button" onClick={() => void saveTeam(team)}>Uložit</button> : <button type="button" onClick={() => { setEditingTeam(team.id); setEditName(team.name); }}>Upravit</button>}<button type="button" className="danger-button" onClick={() => void deleteTeam(team)}>Smazat</button></article>)}</div><div><h3>Hráči</h3>{players.map((player) => <article key={player.id}>{editingPlayer === player.id ? <input className="directory-edit" value={editName} onChange={(event) => setEditName(event.target.value)} /> : <b>{player.name}</b>}<small>{player.points} bodů</small>{editingPlayer === player.id ? <button type="button" onClick={() => void savePlayer(player)}>Uložit</button> : <button type="button" onClick={() => { setEditingPlayer(player.id); setEditName(player.name); }}>Upravit</button>}<button type="button" className="danger-button" onClick={() => void deletePlayer(player)}>Smazat</button></article>)}</div></div>
    </section>
  );
}
