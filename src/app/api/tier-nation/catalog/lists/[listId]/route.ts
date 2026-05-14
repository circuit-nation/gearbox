import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationPublicFetch } from "@/lib/tier-nation/upstream";
import { nextResponseFromUpstream } from "@/lib/tier-nation/proxy-response";

type RouteContext = { params: Promise<{ listId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { listId } = await context.params;
    if (!listId || listId.includes("/") || listId.includes("..")) {
      return NextResponse.json({ error: "Invalid list id" }, { status: 400 });
    }
    const upstream = await tierNationPublicFetch(`/lists/${encodeURIComponent(listId)}`, { method: "GET" });
    return nextResponseFromUpstream(upstream);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Catalog request failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
