import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });

  const settings = await prisma.appSetting.upsert({
    where: { id: "general" },
    update: {},
    create: { id: "general", dashboardVisible: true, leaderboardVisible: true }
  });

  return Response.json({ settings });
}

export async function PATCH(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const dashboardVisible = typeof body.dashboardVisible === "boolean" ? body.dashboardVisible : true;
  const leaderboardVisible = typeof body.leaderboardVisible === "boolean" ? body.leaderboardVisible : true;

  const settings = await prisma.appSetting.upsert({
    where: { id: "general" },
    update: { dashboardVisible, leaderboardVisible },
    create: { id: "general", dashboardVisible, leaderboardVisible }
  });

  return Response.json({ settings });
}
