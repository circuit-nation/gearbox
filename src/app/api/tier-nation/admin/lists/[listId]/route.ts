import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationAdminFetch } from "@/lib/tier-nation/upstream";
import { nextResponseFromUpstream } from "@/lib/tier-nation/proxy-response";

type RouteContext = { params: Promise<{ listId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { listId } = await context.params;
    const bodyText = await request.text();
    const upstream = await tierNationAdminFetch(`/admin/lists/${encodeURIComponent(listId)}`, {
      method: "PATCH",
      body: bodyText,
    });
    return nextResponseFromUpstream(upstream);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Proxy failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { listId } = await context.params;
    const upstream = await tierNationAdminFetch(`/admin/lists/${encodeURIComponent(listId)}`, {
      method: "DELETE",
    });
    return nextResponseFromUpstream(upstream);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Proxy failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
