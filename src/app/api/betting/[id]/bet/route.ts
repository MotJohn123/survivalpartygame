import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bettorId = await getCurrentPlayerId();
  if (!bettorId) return Response.json({ error: "Přihlas se, abys mohl/a sázet." }, { status: 401 });
  const bettingRoundId = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const stake = Number(body.stake);
  const selectedValues = Array.isArray(body.selectedPlayerIds) ? body.selectedPlayerIds as unknown[] : []; const selectedPlayerIds: number[] = Array.from(new Set(selectedValues.map((value) => Number(value)).filter((value) => Number.isInteger(value))));
  if (!Number.isInteger(stake) || stake < 1 || selectedPlayerIds.length === 0) return Response.json({ error: "Zadej vklad a vyber alespoň jednoho hráče." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const round = await tx.bettingRound.findUnique({ where: { id: bettingRoundId }, include: { candidates: true } });
      if (!round || !round.isOpen || round.isResolved) throw new BetError("Tato sázka je už uzavřená.", 409);
      if (stake > round.maxBet) throw new BetError(`Maximální vklad je ${round.maxBet} bodů.`, 400);
      if (selectedPlayerIds.length > round.maxPlayers) throw new BetError(`Vyber nejvýše ${round.maxPlayers} hráče/hráče.`, 400);
      if (selectedPlayerIds.some((id) => !round.candidates.some((candidate) => candidate.playerId === id))) throw new BetError("Mezi vybranými hráči je neplatný kandidát.", 400);

      const existing = await tx.bet.findUnique({ where: { bettingRoundId_bettorId: { bettingRoundId, bettorId } }, select: { id: true, stake: true } });
      const difference = stake - (existing?.stake ?? 0);
      if (difference > 0) {
        const charged = await tx.player.updateMany({ where: { id: bettorId, points: { gte: difference } }, data: { points: { decrement: difference } } });
        if (charged.count !== 1) throw new BetError("Nemáš dostatek bodů pro tento vklad.", 409);
      } else if (difference < 0) {
        await tx.player.update({ where: { id: bettorId }, data: { points: { increment: Math.abs(difference) } } });
      }

      const bet = existing ? await tx.bet.update({ where: { id: existing.id }, data: { stake } }) : await tx.bet.create({ data: { bettingRoundId, bettorId, stake } });
      await tx.betSelection.deleteMany({ where: { betId: bet.id } });
      await tx.betSelection.createMany({ data: selectedPlayerIds.map((candidateId) => ({ betId: bet.id, candidateId })) });
      return { stake, selectedPlayerIds };
    });
    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof BetError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Sázku se nepodařilo uložit." }, { status: 500 });
  }
}

class BetError extends Error { constructor(message: string, public readonly status: number) { super(message); } }
