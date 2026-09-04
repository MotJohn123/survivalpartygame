import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bettorId = await getCurrentPlayerId();
  if (!bettorId) return Response.json({ error: "Přihlas se, abys mohl/a sázet." }, { status: 401 });
  const bettingRoundId = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const candidateId = Number(body.candidatePlayerId);
  const round = await prisma.bettingRound.findUnique({ where: { id: bettingRoundId }, include: { candidates: true } });
  if (!round || !round.isOpen || round.isResolved) return Response.json({ error: "Tato sázka je už uzavřená." }, { status: 409 });
  if (!round.candidates.some((candidate) => candidate.playerId === candidateId)) return Response.json({ error: "Tento hráč není mezi kandidáty." }, { status: 400 });
  const bet = await prisma.bet.upsert({ where: { bettingRoundId_bettorId: { bettingRoundId, bettorId } }, update: { candidateId }, create: { bettingRoundId, bettorId, candidateId } });
  return Response.json({ success: true, bet });
}
