import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationPublicFetch } from "@/lib/tier-nation/upstream";
import { nextResponseFromUpstream } from "@/lib/tier-nation/proxy-response";

export async function GET(request: NextRequest) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const page = Math.max(parseInt(request.nextUrl.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get("limit") || "25", 10), 1), 100);
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
    const upstream = await tierNationPublicFetch(`/lists?${qs}`, { method: "GET" });
    return nextResponseFromUpstream(upstream);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Catalog request failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
