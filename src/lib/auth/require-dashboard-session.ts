import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";
import { verifyAdminSessionToken } from "@/lib/auth/session";

/**
 * Defense in depth: route handlers reject unauthenticated callers even if middleware is bypassed.
 */
export async function requireDashboardSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const session = await verifyAdminSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
