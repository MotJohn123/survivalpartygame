import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ voting: null });
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { teamId: true } });
  const voting = await prisma.voting.findFirst({
    where: { isActive: true, OR: [{ scope: "ALL" }, { scope: "TEAM", teamId: player?.teamId ?? -1 }, { scope: "CUSTOM_GROUP", eligibleVoters: { some: { playerId } } }] },
    orderBy: { createdAt: "desc" },
    include: { options: true, candidates: { include: { player: { select: { id: true, name: true, photoUrl: true, team: { select: { name: true, color: true } } } } } }, responses: { where: { playerId }, select: { id: true } } },
  });
  if (!voting) return Response.json({ voting: null });
  return Response.json({ voting: { id: voting.id, question: voting.question, voteType: voting.voteType, options: voting.options, candidates: voting.candidates.map((candidate) => candidate.player), hasVoted: voting.responses.length > 0 } });
}
