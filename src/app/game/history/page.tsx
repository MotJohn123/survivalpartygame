import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sourceLabels = { TASK: "Úkol", PUBLIC_QUEST_GIFT_RECEIVED: "Veřejný úkol · dar", SETUP_QUESTION: "Otázka", BETTING_WIN: "Sázka", ADMIN_ADJUSTMENT: "Úprava administrátorem" } as const;

export default async function PointsHistoryPage() {
  const playerId = await getCurrentPlayerId();
  if (!playerId) redirect("/");
  const entries = await prisma.pointsLedgerEntry.findMany({ where: { playerId }, orderBy: { createdAt: "desc" }, take: 100 });
  return <main className="history-shell"><header className="board-header"><Link className="brand" href="/game">✦ Survival <em>Party</em></Link><Link href="/game">Zpět do hry</Link></header><section className="board-title"><p className="eyebrow"><span /> stopa bodů</p><h1>Historie<br /><i>výpravy.</i></h1><p>Každý bod má svůj příběh.</p></section><section className="history-list">{entries.length === 0 ? <p className="board-loading">Zatím tu nejsou žádné body.</p> : entries.map((entry) => <article key={entry.id}><div><b>{sourceLabels[entry.source]}</b><small>{entry.note ?? "Bez poznámky"}</small></div><strong className={entry.delta >= 0 ? "positive" : "negative"}>{entry.delta >= 0 ? "+" : ""}{entry.delta}</strong><time>{entry.createdAt.toLocaleDateString("cs-CZ")}</time></article>)}</section></main>;
}
