import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playerId = await getCurrentPlayerId();
  const rounds = await prisma.bettingRound.findMany({ where: { isOpen: true, isResolved: false }, orderBy: { createdAt: "desc" }, include: { teamA: true, teamB: true, candidates: { include: { player: { select: { id: true, name: true, photoUrl: true, team: { select: { name: true, color: true } } } } } }, bets: playerId ? { where: { bettorId: playerId }, include: { selections: { select: { candidateId: true } } } } : false } });
  return Response.json({ rounds: rounds.map((round) => { const bet = round.bets[0] as unknown as { stake: number; selections: { candidateId: number }[] } | undefined; return { id: round.id, title: round.title, maxBet: round.maxBet, multiplier: round.multiplier, maxPlayers: round.maxPlayers, isOpen: round.isOpen, teamA: round.teamA, teamB: round.teamB, candidates: round.candidates.map((candidate) => candidate.player), stake: bet?.stake ?? 0, selectedPlayerIds: bet?.selections.map((selection) => selection.candidateId) ?? [] }; }) });
}
