import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ error: "Přihlas se, abys mohl/a hlasovat." }, { status: 401 });
  const votingId = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (!Number.isInteger(votingId) || !answer) return Response.json({ error: "Odpověď není platná." }, { status: 400 });
  const voting = await prisma.voting.findFirst({ where: { id: votingId, isActive: true }, include: { options: true, candidates: true, eligibleVoters: true } });
  if (!voting) return Response.json({ error: "Hlasování už není aktivní." }, { status: 404 });
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { teamId: true } });
  const eligible = voting.scope === "ALL" || (voting.scope === "TEAM" && voting.teamId === player?.teamId) || (voting.scope === "CUSTOM_GROUP" && voting.eligibleVoters.some((voter) => voter.playerId === playerId));
  if (!eligible) return Response.json({ error: "Do tohoto hlasování nemáš přístup." }, { status: 403 });
  if (voting.voteType === "YES_NO" && !["yes", "no"].includes(answer)) return Response.json({ error: "Vyber Ano nebo Ne." }, { status: 400 });
  if (voting.voteType === "MULTIPLE_CHOICE" && !voting.options.some((option) => String(option.id) === answer)) return Response.json({ error: "Vybraná možnost neexistuje." }, { status: 400 });
  if (voting.voteType === "PLAYER_SELECT" && !voting.candidates.some((candidate) => String(candidate.playerId) === answer)) return Response.json({ error: "Vybraný hráč není kandidát." }, { status: 400 });
  try { await prisma.voteResponse.create({ data: { votingId, playerId, answer } }); } catch { return Response.json({ error: "Hlas už byl zaznamenán." }, { status: 409 }); }
  return Response.json({ success: true });
}
