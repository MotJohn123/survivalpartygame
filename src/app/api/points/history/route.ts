import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ error: "Nepřihlášený hráč." }, { status: 401 });

  const entries = await prisma.pointsLedgerEntry.findMany({
    where: { playerId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, delta: true, source: true, note: true, createdAt: true },
  });
  return Response.json({ entries });
}
