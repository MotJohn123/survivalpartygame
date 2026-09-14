import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/settings`, { cache: "no-store" });
  const settings = response.ok ? await response.json() : { dashboardVisible: true };
  if (!settings.dashboardVisible) {
    return <main className="dashboard-shell"><header className="board-header"><a className="brand" href="/">✦ Survival <em>Party</em></a></header><section className="board-title"><p className="eyebrow"><span /> výprava</p><h1>Nástěnka<br /><i>skryta.</i></h1><p>Počkejte na další oznámení.</p></section></main>;
  }
  return <DashboardView />;
}
