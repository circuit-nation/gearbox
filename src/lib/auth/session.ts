import { SignJWT, jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "./constants";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function tryGetEncodedSecret(): Uint8Array | null {
  const raw = process.env.ADMIN_SESSION_SECRET;
  if (!raw || raw.length < 16) {
    return null;
  }
  return new TextEncoder().encode(raw);
}

export async function signAdminSessionToken() {
  const secret = tryGetEncodedSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 16 characters.");
  }
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secret);
}

export async function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }
  const secret = tryGetEncodedSecret();
  if (!secret) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export function adminSessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: ADMIN_SESSION_COOKIE,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
