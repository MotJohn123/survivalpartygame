import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  return Response.json({ questions: await prisma.setupQuestion.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { answers: true } } } }) });
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const points = Number(body.points);
  const scope = body.scope === "TEAM" || body.scope === "CUSTOM_GROUP" ? body.scope : "ALL";
  const teamId = scope === "TEAM" ? Number(body.teamId) : null;
  const playerIds: number[] = Array.isArray(body.playerIds) ? Array.from(new Set((body.playerIds as unknown[]).map(Number).filter((value) => Number.isInteger(value)))) : [];
  if (!text || !Number.isInteger(points) || points < 0 || (scope === "TEAM" && !Number.isInteger(teamId)) || (scope === "CUSTOM_GROUP" && !playerIds.length)) return Response.json({ error: "Vyplň otázku, odměnu a cílové hráče." }, { status: 400 });
  const question = await prisma.setupQuestion.create({ data: { text, points, scope, teamId, eligiblePlayers: scope === "CUSTOM_GROUP" ? { create: playerIds.map((playerId) => ({ playerId })) } : undefined } });
  return Response.json({ question }, { status: 201 });
}
