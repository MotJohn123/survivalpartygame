import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ error: "Nepřihlášený hráč." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const keys = body.keys as { p256dh?: string; auth?: string } | undefined;
  if (!endpoint || !keys?.p256dh || !keys.auth) return Response.json({ error: "Subscription není platná." }, { status: 400 });
  await prisma.pushSubscription.upsert({ where: { endpoint }, update: { playerId, p256dh: keys.p256dh, auth: keys.auth }, create: { playerId, endpoint, p256dh: keys.p256dh, auth: keys.auth } });
  return Response.json({ success: true });
}
