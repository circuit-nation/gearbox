import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyClientToken(request: NextRequest): NextResponse | null {
  const expected = process.env.CN_CLIENT_API_TOKEN;
  if (!expected) {
    console.error("[client-token] CN_CLIENT_API_TOKEN is not configured");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token || !safeEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
