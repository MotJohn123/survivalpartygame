import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  return Response.json({ rounds: await prisma.bettingRound.findMany({ orderBy: { createdAt: "desc" }, include: { teamA: true, teamB: true, candidates: { include: { player: true } }, winners: true } }) });
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({})); const teamAId = Number(body.teamAId); const teamBId = Number(body.teamBId); const candidatePlayerIds = Array.isArray(body.candidatePlayerIds) ? body.candidatePlayerIds.map(Number).filter(Number.isInteger) : []; const rewardPoints = Number(body.rewardPoints);
  if (!Number.isInteger(teamAId) || !Number.isInteger(teamBId) || teamAId === teamBId || candidatePlayerIds.length < 2 || !Number.isInteger(rewardPoints) || rewardPoints < 1) return Response.json({ error: "Vyplň dva různé týmy, kandidáty a odměnu." }, { status: 400 });
  const round = await prisma.bettingRound.create({ data: { title: typeof body.title === "string" ? body.title.trim() : null, teamAId, teamBId, rewardPoints, candidates: { create: candidatePlayerIds.map((playerId: number) => ({ playerId })) } } });
  return Response.json({ round }, { status: 201 });
}
