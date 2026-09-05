import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ questions: [] });
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { teamId: true } });
  const questions = await prisma.setupQuestion.findMany({ where: { isActive: true, answers: { none: { playerId } }, OR: [{ scope: "ALL" }, { scope: "TEAM", teamId: player?.teamId ?? -1 }, { scope: "CUSTOM_GROUP", eligiblePlayers: { some: { playerId } } }] }, orderBy: { createdAt: "asc" }, select: { id: true, text: true, points: true } });
  return Response.json({ questions });
}
