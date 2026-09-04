import { clearAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  await clearAdminSession();
  return Response.redirect(new URL("/admin", request.url));
}
