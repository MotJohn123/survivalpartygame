import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const fromId = await getCurrentPlayerId(); const body = await request.json().catch(() => ({})); const toId = Number(body.toPlayerId); const points = Number(body.points); const reason = typeof body.reason === "string" ? body.reason.trim() : "Veřejný úkol";
  if (!fromId) return Response.json({ error: "Přihlas se pro darování bodů." }, { status: 401 });
  if (!Number.isInteger(toId) || toId === fromId || !Number.isInteger(points) || points < 1 || points > 100) return Response.json({ error: "Vyber jiného hráče a platný počet bodů." }, { status: 400 });
  const recipient = await prisma.player.findUnique({ where: { id: toId }, select: { id: true } });
  if (!recipient) return Response.json({ error: "Hráč nebyl nalezen." }, { status: 404 });
  await prisma.$transaction(async (tx) => { await tx.pointsTransfer.create({ data: { fromId, toId, points, reason } }); await tx.player.update({ where: { id: toId }, data: { points: { increment: points } } }); await tx.pointsLedgerEntry.create({ data: { playerId: toId, delta: points, source: "PUBLIC_QUEST_GIFT_RECEIVED", note: reason } }); });
  return Response.json({ success: true });
}
