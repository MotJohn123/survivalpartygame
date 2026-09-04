import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ questions: [] });
  const questions = await prisma.setupQuestion.findMany({ where: { isActive: true, answers: { none: { playerId } } }, orderBy: { createdAt: "asc" }, select: { id: true, text: true, points: true } });
  return Response.json({ questions });
}
