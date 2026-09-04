import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPlayers } from "@/lib/push";

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { completions: true } } } });
  return Response.json({ tasks });
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Neplatný požadavek." }, { status: 400 }); }
  const taskCode = typeof body.taskCode === "string" ? body.taskCode.trim().toUpperCase() : "";
  const taskText = typeof body.taskText === "string" ? body.taskText.trim() : "";
  const taskPoints = Number(body.taskPoints);
  const repeatability = body.repeatability === "MULTIPLE" || body.repeatability === "UNLIMITED" ? body.repeatability : "ONCE";
  const maxCompletions = repeatability === "MULTIPLE" ? Number(body.maxCompletions) || 1 : null;
  if (!taskCode || !taskText || !Number.isInteger(taskPoints) || taskPoints < 1) return Response.json({ error: "Vyplň kód, text a kladnou odměnu." }, { status: 400 });
  try {
    const task = await prisma.task.create({ data: { taskCode, taskText, taskPoints, repeatability, maxCompletions, isPublicQuest: body.isPublicQuest === true } });
    await notifyPlayers("Nový úkol", `Je dostupný nový úkol s kódem ${task.taskCode}.`);
    return Response.json({ task }, { status: 201 });
  } catch {
    return Response.json({ error: "Kód úkolu už existuje nebo data nejsou platná." }, { status: 409 });
  }
}
