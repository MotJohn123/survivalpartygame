import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentPlayerId = await getCurrentPlayerId();
  const players = await prisma.player.findMany({
    orderBy: [{ points: "desc" }, { name: "asc" }],
    select: { id: true, name: true, points: true, photoUrl: true, team: { select: { name: true, color: true } } },
  });
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, players: { select: { points: true } } },
  });

  return Response.json({
    currentPlayerId,
    players: players.map((player, index) => ({ ...player, rank: index + 1 })),
    teams: teams.map((team) => ({ id: team.id, name: team.name, color: team.color, points: team.players.reduce((total, player) => total + player.points, 0) })).sort((a, b) => b.points - a.points),
  });
}
