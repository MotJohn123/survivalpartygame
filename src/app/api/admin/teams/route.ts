import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const [teams, players] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" }, include: { players: { orderBy: { name: "asc" }, select: { id: true, name: true, points: true, teamId: true } } } }),
    prisma.player.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, points: true, teamId: true } }),
  ]);
  return Response.json({ teams, players });
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color : "#df633d";
  if (!name) return Response.json({ error: "Název týmu je povinný." }, { status: 400 });
  try { return Response.json({ team: await prisma.team.create({ data: { name, color } }) }, { status: 201 }); }
  catch { return Response.json({ error: "Tým s tímto názvem už existuje." }, { status: 409 }); }
}

export async function PATCH(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const playerId = Number(body.playerId);
  const teamId = body.teamId === null || body.teamId === "" ? null : Number(body.teamId);
  if (!Number.isInteger(playerId) || (teamId !== null && !Number.isInteger(teamId))) return Response.json({ error: "Neplatné přiřazení." }, { status: 400 });
  return Response.json({ player: await prisma.player.update({ where: { id: playerId }, data: { teamId } }) });
}
