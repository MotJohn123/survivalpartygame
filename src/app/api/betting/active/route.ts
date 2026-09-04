import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playerId = await getCurrentPlayerId();
  const round = await prisma.bettingRound.findFirst({ where: { OR: [{ isOpen: true }, { isResolved: true } ] }, orderBy: { createdAt: "desc" }, include: { teamA: true, teamB: true, candidates: { include: { player: { select: { id: true, name: true, photoUrl: true, team: { select: { name: true, color: true } } } } } }, bets: playerId ? { where: { bettorId: playerId }, select: { candidateId: true } } : false, winners: true } });
  if (!round) return Response.json({ round: null });
  return Response.json({ round: { id: round.id, title: round.title, rewardPoints: round.rewardPoints, isOpen: round.isOpen, isResolved: round.isResolved, teamA: round.teamA, teamB: round.teamB, candidates: round.candidates.map((candidate) => candidate.player), betCandidateId: round.bets[0]?.candidateId ?? null, winnerIds: round.winners.map((winner) => winner.playerId) } });
}
