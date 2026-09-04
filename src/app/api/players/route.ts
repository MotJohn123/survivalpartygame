import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await getCurrentPlayerId()) return Response.json({ players: [] });
  return Response.json({ players: await prisma.player.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, team: { select: { name: true, color: true } } } }) });
}
