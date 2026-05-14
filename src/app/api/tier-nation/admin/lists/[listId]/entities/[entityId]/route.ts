import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationAdminFetch } from "@/lib/tier-nation/upstream";
import { nextResponseFromUpstream } from "@/lib/tier-nation/proxy-response";

type RouteContext = { params: Promise<{ listId: string; entityId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { listId, entityId } = await context.params;
    const upstream = await tierNationAdminFetch(
      `/admin/lists/${encodeURIComponent(listId)}/entities/${encodeURIComponent(entityId)}`,
      { method: "DELETE" },
    );
    return nextResponseFromUpstream(upstream);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Proxy failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
