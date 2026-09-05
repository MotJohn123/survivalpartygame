import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ error: "Pro splnění úkolu se nejdřív přihlas." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const taskCode = typeof body === "object" && body !== null && "taskCode" in body && typeof body.taskCode === "string"
    ? body.taskCode.trim().toUpperCase()
    : "";
  const photoUrl = typeof body === "object" && body !== null && "photoUrl" in body && typeof body.photoUrl === "string"
    ? body.photoUrl
    : undefined;

  if (!taskCode) return Response.json({ error: "Chybí kód úkolu." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({ where: { taskCode, isActive: true } });
      if (!task) throw new TaskError("Tento úkol neexistuje nebo už není aktivní.", 404);

      const completionCount = await tx.taskCompletion.count({ where: task.repeatability === "ONCE" || task.repeatability === "MULTIPLE" ? { taskId: task.id } : { taskId: task.id, playerId } });
      const limit = task.repeatability === "ONCE" || task.repeatability === "PER_PLAYER_ONCE" ? 1 : task.repeatability === "MULTIPLE" ? (task.maxCompletions ?? 1) : null;
      if (limit !== null && completionCount >= limit) throw new TaskError("Tento úkol už jsi splnil/a maximální počet krát.", 409);

      const pointsAwarded = task.isPublicQuest ? 0 : task.taskPoints;
      await tx.taskCompletion.create({ data: { taskId: task.id, playerId, pointsAwarded, photoUrl } });

      if (!task.isPublicQuest) {
        await tx.player.update({ where: { id: playerId }, data: { points: { increment: pointsAwarded } } });
        await tx.pointsLedgerEntry.create({ data: { playerId, delta: pointsAwarded, source: "TASK", note: task.taskText } });
      }

      const player = await tx.player.findUniqueOrThrow({ where: { id: playerId }, select: { points: true } });
      return { pointsAwarded, points: player.points, publicQuest: task.isPublicQuest };
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof TaskError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Úkol se nepodařilo dokončit." }, { status: 500 });
  }
}

class TaskError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}
