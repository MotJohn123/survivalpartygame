import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TaskPanel from "./TaskPanel";
import VotingPanel from "./VotingPanel";
import BettingPanel from "./BettingPanel";
import NotificationButton from "./NotificationButton";
import PhotoUpload from "./PhotoUpload";
import QuestionsPanel from "./QuestionsPanel";
import GiftPanel from "./GiftPanel";

export default async function GamePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const playerId = await getCurrentPlayerId();
  if (!playerId) redirect("/");

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { team: true },
  });

  if (!player) redirect("/");

  return (
    <main className="game-shell">
      <header className="game-header"><Link className="brand" href="/">✦ Survival <em>Party</em></Link><nav className="game-nav"><NotificationButton /><Link href="/leaderboard">Žebříček</Link><Link href="/game/history">Historie bodů</Link><a href="/api/auth/logout">Odhlásit</a></nav></header>
      <section className="game-welcome"><PhotoUpload currentPhoto={player.photoUrl} /><p className="eyebrow"><span /> tvůj tábor</p><h1>Vítej, <i>{player.name}.</i></h1><p className="game-intro">Výprava čeká. Zatím máš na kontě:</p><div className="points-card"><strong>{player.points}</strong><span>bodů</span></div><div className="team-note">{player.team ? <>Tvůj kmen: <b>{player.team.name}</b></> : "Zatím nejsi v žádném týmu"}</div></section>
      <TaskPanel initialCode={code} initialPoints={player.points} />
      <VotingPanel />
      <BettingPanel />
      <QuestionsPanel />
      <GiftPanel />
    </main>
  );
}
