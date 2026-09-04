import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const points = Number(body.points);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "Administrátorská úprava";
  let playerIds: number[] = Array.isArray(body.playerIds) ? body.playerIds.map(Number).filter(Number.isInteger) : [];
  if (body.teamId !== undefined) {
    const teamId = Number(body.teamId);
    const players = await prisma.player.findMany({ where: { teamId }, select: { id: true } });
    playerIds = players.map((player) => player.id);
  }
  if (!Number.isInteger(points) || points === 0 || playerIds.length === 0) return Response.json({ error: "Vyber hráče nebo tým a zadej nenulovou změnu bodů." }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    for (const playerId of playerIds) {
      await tx.player.update({ where: { id: playerId }, data: { points: { increment: points } } });
      await tx.pointsLedgerEntry.create({ data: { playerId, delta: points, source: "ADMIN_ADJUSTMENT", note: reason } });
    }
  });
  return Response.json({ success: true, updated: playerIds.length });
}
