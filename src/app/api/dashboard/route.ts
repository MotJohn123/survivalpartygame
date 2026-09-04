import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.dashboardPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, text: true, photoUrl: true, isSystem: true, createdAt: true, player: { select: { name: true, photoUrl: true, team: { select: { color: true } } } } },
  });
  return Response.json({ posts });
}
