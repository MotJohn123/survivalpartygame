"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BoardData = {
  currentPlayerId: number | null;
  players: { id: number; rank: number; name: string; points: number; team: { name: string; color: string | null } | null }[];
  teams: { id: number; name: string; points: number; color: string | null }[];
};

export default function LeaderboardView() {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) {
        if (active) setError("Žebříček se nepodařilo načíst.");
        return;
      }
      if (active) setData(await response.json());
    };
    void load();
    const interval = window.setInterval(load, 10000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  return <main className="board-shell"><header className="board-header"><Link className="brand" href="/">✦ Survival <em>Party</em></Link><Link href="/game">Zpět do hry</Link></header><section className="board-title"><p className="eyebrow"><span /> živé pořadí</p><h1>Kdo vede<br /><i>výpravu?</i></h1><p>Body se přepočítávají každých deset sekund.</p></section>{error && <p className="board-error">{error}</p>} {!data ? <p className="board-loading">Načítám žebříček…</p> : <div className="board-grid"><section className="board-list"><h2>Hráči</h2>{data.players.map((player) => <div className={`board-row ${player.id === data.currentPlayerId ? "is-you" : ""}`} key={player.id}><strong>{String(player.rank).padStart(2, "0")}</strong><span className="avatar-dot" style={{ background: player.team?.color ?? "#df633d" }} /> <div><b>{player.name}</b><small>{player.team?.name ?? "Bez kmene"}</small></div><em>{player.points} b.</em></div>)}</section><section className="board-list"><h2>Kmeny</h2>{data.teams.map((team, index) => <div className="board-row" key={team.id}><strong>{String(index + 1).padStart(2, "0")}</strong><span className="avatar-dot" style={{ background: team.color ?? "#df633d" }} /><div><b>{team.name}</b><small>celkem za kmen</small></div><em>{team.points} b.</em></div>)}</section></div>}</main>;
}
