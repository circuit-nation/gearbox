import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/auth/session";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const session = await verifyAdminSessionToken(token);
  return NextResponse.json({ authenticated: Boolean(session) });
}
