import { isAdminAuthenticated } from "@/lib/auth";
import { notifyPlayers } from "@/lib/push";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  return Response.json({ posts: await prisma.dashboardPost.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { player: { select: { name: true } } } }) });
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const photoUrl = typeof body.photoUrl === "string" && body.photoUrl ? body.photoUrl : null;
  if (!text || !photoUrl) return Response.json({ error: "Text i fotka příspěvku jsou povinné." }, { status: 400 });
  const post = await prisma.dashboardPost.create({ data: { text, photoUrl, isSystem: true } });
  await notifyPlayers("Novinka z nástěnky", text);
  return Response.json({ post }, { status: 201 });
}
