import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPlayers } from "@/lib/push";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  return Response.json({ votings: await prisma.voting.findMany({ orderBy: { createdAt: "desc" }, include: { options: true, _count: { select: { responses: true } } } }) });
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const voteType = body.voteType === "MULTIPLE_CHOICE" || body.voteType === "PLAYER_SELECT" ? body.voteType : "YES_NO";
  const scope = body.scope === "TEAM" || body.scope === "CUSTOM_GROUP" ? body.scope : "ALL";
  if (!question) return Response.json({ error: "Otázka je povinná." }, { status: 400 });
  const voting = await prisma.voting.create({ data: { question, voteType, scope, teamId: scope === "TEAM" ? Number(body.teamId) : null, options: voteType === "MULTIPLE_CHOICE" ? { create: Array.isArray(body.options) ? body.options.filter((text: unknown) => typeof text === "string" && text.trim()).map((text: string) => ({ text: text.trim() })) : [] } : undefined } });
  await notifyPlayers("Nové hlasování", voting.question);
  return Response.json({ voting }, { status: 201 });
}
