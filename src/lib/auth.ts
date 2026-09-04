import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const playerCookie = "survival_party_session";
const adminCookie = "survival_party_admin_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "local-development-secret-change-me");

export async function createPlayerSession(playerId: number) {
  const token = await new SignJWT({ playerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(playerCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getCurrentPlayerId() {
  const token = (await cookies()).get(playerCookie)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.playerId === "number" ? payload.playerId : null;
  } catch {
    return null;
  }
}

export async function clearPlayerSession() {
  (await cookies()).delete(playerCookie);
}

export async function createAdminSession() {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
  (await cookies()).set(adminCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(adminCookie)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function clearAdminSession() {
  (await cookies()).delete(adminCookie);
}
