import { prisma } from "@/lib/prisma";

export default async function LeaderboardGate() {
  const settings = await prisma.appSetting.upsert({
    where: { id: "general" },
    update: {},
    create: { id: "general", dashboardVisible: true, leaderboardVisible: true }
  });

  if (!settings.leaderboardVisible) {
    return null;
  }

  const { default: LeaderboardView } = await import("./LeaderboardView");
  return <LeaderboardView />;
}
