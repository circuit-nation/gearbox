import { NextResponse } from "next/server";
import { adminSessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const opts = adminSessionCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(opts.name, "", {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: 0,
  });
  return response;
}
