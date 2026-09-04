import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const playerId = await getCurrentPlayerId(); const questionId = Number((await params).id); const body = await request.json().catch(() => ({})); const answerText = typeof body.answerText === "string" ? body.answerText.trim() : "";
  if (!playerId) return Response.json({ error: "Přihlas se pro odpověď." }, { status: 401 });
  if (!answerText || answerText.length > 500) return Response.json({ error: "Odpověď musí mít 1 až 500 znaků." }, { status: 400 });
  try { const result = await prisma.$transaction(async (tx) => { const question = await tx.setupQuestion.findFirst({ where: { id: questionId, isActive: true } }); if (!question) throw new Error("Otázka už není aktivní."); await tx.questionAnswer.create({ data: { questionId, playerId, answerText } }); await tx.dashboardPost.create({ data: { playerId, text: answerText } }); if (question.points) { await tx.player.update({ where: { id: playerId }, data: { points: { increment: question.points } } }); await tx.pointsLedgerEntry.create({ data: { playerId, delta: question.points, source: "SETUP_QUESTION", note: question.text } }); } return question.points; }); return Response.json({ success: true, pointsAwarded: result }); } catch { return Response.json({ error: "Na tuto otázku už bylo odpovězeno nebo není aktivní." }, { status: 409 }); }
}
