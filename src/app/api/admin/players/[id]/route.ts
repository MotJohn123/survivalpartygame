import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const id = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!Number.isInteger(id) || name.length < 2 || name.length > 40) return Response.json({ error: "Jméno musí mít 2 až 40 znaků." }, { status: 400 });
  try {
    return Response.json({ player: await prisma.player.update({ where: { id }, data: { name } }) });
  } catch {
    return Response.json({ error: "Hráč s tímto jménem už existuje." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Neplatné ID hráče." }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.bet.deleteMany({ where: { OR: [{ bettorId: id }, { candidateId: id }] } });
      await tx.bettingCandidate.deleteMany({ where: { playerId: id } });
      await tx.bettingWinner.deleteMany({ where: { playerId: id } });
      await tx.voteResponse.deleteMany({ where: { playerId: id } });
      await tx.voteCandidate.deleteMany({ where: { playerId: id } });
      await tx.voteEligibleVoter.deleteMany({ where: { playerId: id } });
      await tx.questionAnswer.deleteMany({ where: { playerId: id } });
      await tx.pointsTransfer.deleteMany({ where: { OR: [{ fromId: id }, { toId: id }] } });
      await tx.pointsLedgerEntry.deleteMany({ where: { playerId: id } });
      await tx.pushSubscription.deleteMany({ where: { playerId: id } });
      await tx.taskCompletion.deleteMany({ where: { playerId: id } });
      await tx.dashboardPost.deleteMany({ where: { playerId: id } });
      await tx.player.delete({ where: { id } });
    });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Hráče se nepodařilo smazat." }, { status: 409 });
  }
}
