import { clearPlayerSession } from "@/lib/auth";

export async function GET(request: Request) {
  await clearPlayerSession();
  return Response.redirect(new URL("/", request.url));
}
