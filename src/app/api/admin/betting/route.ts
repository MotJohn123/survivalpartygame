import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  return Response.json({ rounds: await prisma.bettingRound.findMany({ orderBy: { createdAt: "desc" }, include: { teamA: true, teamB: true, candidates: { include: { player: { include: { team: true } } } }, winners: true } }) });
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({})); const candidateValues = Array.isArray(body.candidatePlayerIds) ? body.candidatePlayerIds as unknown[] : []; const candidatePlayerIds: number[] = Array.from(new Set(candidateValues.map((value) => Number(value)).filter((value) => Number.isInteger(value)))); const maxBet = Number(body.maxBet); const multiplier = Number(body.multiplier); const maxPlayers = Number(body.maxPlayers);
  if (candidatePlayerIds.length < 1 || !Number.isInteger(maxBet) || maxBet < 1 || !Number.isInteger(multiplier) || multiplier < 1 || !Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > candidatePlayerIds.length) return Response.json({ error: "Vyber kandidáty a platný limit, násobitel a počet hráčů." }, { status: 400 });
  const round = await prisma.bettingRound.create({ data: { title: typeof body.title === "string" ? body.title.trim() : null, maxBet, multiplier, maxPlayers, candidates: { create: candidatePlayerIds.map((playerId: number) => ({ playerId })) } } });
  return Response.json({ round }, { status: 201 });
}
