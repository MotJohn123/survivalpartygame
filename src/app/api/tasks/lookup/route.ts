import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code) return Response.json({ error: "Zadej kód úkolu." }, { status: 400 });

  const task = await prisma.task.findFirst({
    where: { taskCode: code, isActive: true },
    select: { id: true, taskCode: true, taskText: true, taskPoints: true, isPublicQuest: true },
  });

  if (!task) return Response.json({ error: "Tento úkol neexistuje nebo už není aktivní." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json({ task }, { headers: { "Cache-Control": "no-store" } });
}
