import { createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Neplatný požadavek." }, { status: 400 }); }
  const password = typeof body === "object" && body !== null && "password" in body && typeof body.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD ?? "survivalparty";
  if (!password || password !== expected) return Response.json({ error: "Heslo správce není správné." }, { status: 401 });
  await createAdminSession();
  return Response.json({ success: true });
}
