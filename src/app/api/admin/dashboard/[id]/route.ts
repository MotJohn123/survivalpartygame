import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Neplatné ID příspěvku." }, { status: 400 });
  await prisma.dashboardPost.delete({ where: { id } });
  return Response.json({ success: true });
}
