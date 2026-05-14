import { NextResponse } from "next/server";
import { timingSafeStringEqual } from "@/lib/auth/secret-compare";
import { adminSessionCookieOptions, signAdminSessionToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username ?? "";
    const password = body.password ?? "";

    const expectedUser = process.env.TIER_NATION_ADMIN_USERNAME ?? "";
    const expectedPass = process.env.TIER_NATION_ADMIN_PASSWORD ?? "";

    if (!expectedUser || !expectedPass) {
      return NextResponse.json(
        { error: "Server login is not configured (missing Tier Nation admin credentials)." },
        { status: 500 }
      );
    }

    if (!timingSafeStringEqual(expectedUser, username) || !timingSafeStringEqual(expectedPass, password)) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = await signAdminSessionToken();
    const opts = adminSessionCookieOptions();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(opts.name, token, {
      httpOnly: opts.httpOnly,
      sameSite: opts.sameSite,
      secure: opts.secure,
      path: opts.path,
      maxAge: opts.maxAge,
    });
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
