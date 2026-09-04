import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const id = Number((await params).id);
  const voting = await prisma.voting.update({ where: { id }, data: { isActive: false, closedAt: new Date() } });
  return Response.json({ voting });
}
