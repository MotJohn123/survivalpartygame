import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ error: "Nepřihlášený hráč." }, { status: 401 });

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { team: { include: { players: { orderBy: { name: "asc" }, select: { id: true, name: true, points: true, photoUrl: true } } } } },
  });

  if (!player) return Response.json({ error: "Hráč nebyl nalezen." }, { status: 404 });

  return Response.json({
    id: player.id,
    name: player.name,
    points: player.points,
    photoUrl: player.photoUrl,
    team: player.team,
  });
}
