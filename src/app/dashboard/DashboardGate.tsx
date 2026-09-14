import { prisma } from "@/lib/prisma";

export default async function DashboardGate() {
  const settings = await prisma.appSetting.upsert({
    where: { id: "general" },
    update: {},
    create: { id: "general", dashboardVisible: true, leaderboardVisible: true }
  });

  if (!settings.dashboardVisible) {
    return null;
  }

  const { default: DashboardView } = await import("./DashboardView");
  return <DashboardView />;
}
