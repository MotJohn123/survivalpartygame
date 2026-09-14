import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const dashboardVisible = typeof body.dashboardVisible === "boolean" ? body.dashboardVisible : true;
  const leaderboardVisible = typeof body.leaderboardVisible === "boolean" ? body.leaderboardVisible : true;

  await Promise.all([
    prisma.appSetting.upsert({ where: { key: "dashboardVisible" }, update: { value: String(dashboardVisible) }, create: { key: "dashboardVisible", value: String(dashboardVisible) } }),
    prisma.appSetting.upsert({ where: { key: "leaderboardVisible" }, update: { value: String(leaderboardVisible) }, create: { key: "leaderboardVisible", value: String(leaderboardVisible) } }),
  ]);

  return Response.json({ dashboardVisible, leaderboardVisible });
}
