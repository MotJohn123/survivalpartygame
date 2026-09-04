import { put } from "@vercel/blob";
import { getCurrentPlayerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return Response.json({ error: "Pro nahrání fotky se přihlas." }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxSize) return Response.json({ error: "Použij JPG, PNG nebo WebP do velikosti 5 MB." }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: "Úložiště fotek zatím není nakonfigurované." }, { status: 503 });
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  try {
    const blob = await put(`players/${playerId}-${Date.now()}.${extension}`, file, { access: "public", addRandomSuffix: true });
    await prisma.player.update({ where: { id: playerId }, data: { photoUrl: blob.url } });
    return Response.json({ url: blob.url });
  } catch {
    return Response.json({ error: "Fotku se nepodařilo uložit do Blob úložiště. Zkontroluj BLOB_READ_WRITE_TOKEN." }, { status: 502 });
  }
}
