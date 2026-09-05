import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const bettingRoundId = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const winnerValues = Array.isArray(body.winnerPlayerIds) ? body.winnerPlayerIds as unknown[] : []; const winnerPlayerIds: number[] = Array.from(new Set(winnerValues.map((value) => Number(value)).filter((value) => Number.isInteger(value))));
  if (!winnerPlayerIds.length) return Response.json({ error: "Vyber alespoň jednoho vítěze." }, { status: 400 });
  const result = await prisma.$transaction(async (tx) => {
    const round = await tx.bettingRound.update({ where: { id: bettingRoundId }, data: { isOpen: false, isResolved: true, resolvedAt: new Date(), winners: { create: winnerPlayerIds.map((playerId: number) => ({ playerId })) } } });
    const winningBets = await tx.bet.findMany({ where: { bettingRoundId, OR: [{ candidateId: { in: winnerPlayerIds } }, { selections: { some: { candidateId: { in: winnerPlayerIds } } } }] } });
    for (const bet of winningBets) {
      const reward = bet.stake * round.multiplier;
      await tx.player.update({ where: { id: bet.bettorId }, data: { points: { increment: reward } } });
      await tx.pointsLedgerEntry.create({ data: { playerId: bet.bettorId, delta: reward, source: "BETTING_WIN", note: `${round.title ?? "Výhra v sázce"} · ${bet.stake} × ${round.multiplier}` } });
    }
    return { round, winnersPaid: winningBets.length };
  });
  return Response.json(result);
}
