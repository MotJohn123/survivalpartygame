import { put } from "@vercel/blob";
import { isAdminAuthenticated } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ error: "Neautorizovaný přístup." }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxSize) return Response.json({ error: "Vyber JPG, PNG nebo WebP do velikosti 5 MB." }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: "Úložiště fotek zatím není nakonfigurované." }, { status: 503 });
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const token = process.env.BLOB_READ_WRITE_TOKEN.replace(/^"|"$/g, "").trim();
  try {
    const blob = await put(`dashboard/${Date.now()}.${extension}`, file, { access: "public", addRandomSuffix: true, token });
    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("Dashboard photo Blob upload failed", error);
    return Response.json({ error: "Fotku se nepodařilo uložit do Blob úložiště. Zkontroluj BLOB_READ_WRITE_TOKEN." }, { status: 502 });
  }
}
