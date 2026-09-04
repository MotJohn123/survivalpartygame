import { prisma } from "@/lib/prisma";
import { createPlayerSession } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const name = typeof body === "object" && body !== null && "name" in body && typeof body.name === "string"
    ? body.name.trim()
    : "";

  if (name.length < 2 || name.length > 40) {
    return Response.json({ error: "Jméno musí mít 2 až 40 znaků." }, { status: 400 });
  }

  const existingPlayer = await prisma.player.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  const player = existingPlayer ?? await prisma.player.create({ data: { name } });
  await createPlayerSession(player.id);

  return Response.json({ player: { id: player.id, name: player.name, points: player.points } });
}
