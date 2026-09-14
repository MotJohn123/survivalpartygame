import LeaderboardView from "./LeaderboardView";

export default async function LeaderboardPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/settings`, { cache: "no-store" });
  const settings = response.ok ? await response.json() : { leaderboardVisible: true };
  if (!settings.leaderboardVisible) {
    return <main className="board-shell"><header className="board-header"><a className="brand" href="/">✦ Survival <em>Party</em></a></header><section className="board-title"><p className="eyebrow"><span /> výprava</p><h1>Žebříček<br /><i>skryt.</i></h1><p>Počkejte na další aktualizaci.</p></section></main>;
  }
  return <LeaderboardView />;
}
