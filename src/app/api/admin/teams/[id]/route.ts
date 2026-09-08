import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const id = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color : undefined;
  if (!Number.isInteger(id) || !name) return Response.json({ error: "Název týmu je povinný." }, { status: 400 });
  try { return Response.json({ team: await prisma.team.update({ where: { id }, data: { name, ...(color ? { color } : {}) } }) }); }
  catch { return Response.json({ error: "Tým s tímto názvem už existuje." }, { status: 409 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Neplatné ID týmu." }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    await tx.player.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await tx.voting.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await tx.bettingRound.updateMany({ where: { teamAId: id }, data: { teamAId: null } });
    await tx.bettingRound.updateMany({ where: { teamBId: id }, data: { teamBId: null } });
    await tx.team.delete({ where: { id } });
  });
  return Response.json({ success: true });
}
