import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const defaults = {
  dashboardVisible: "true",
  leaderboardVisible: "true",
};

function getBoolean(value: string | null | undefined, fallback: boolean) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export async function GET() {
  const dashboardVisible = await prisma.appSetting.findUnique({ where: { key: "dashboardVisible" } });
  const leaderboardVisible = await prisma.appSetting.findUnique({ where: { key: "leaderboardVisible" } });
  return Response.json({
    dashboardVisible: getBoolean(dashboardVisible?.value ?? defaults.dashboardVisible, true),
    leaderboardVisible: getBoolean(leaderboardVisible?.value ?? defaults.leaderboardVisible, true),
  });
}

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
