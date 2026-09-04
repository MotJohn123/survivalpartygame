import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Neplatné ID úkolu." }, { status: 400 });
  const task = await prisma.task.update({ where: { id }, data: { isActive: false } });
  return Response.json({ task });
}
