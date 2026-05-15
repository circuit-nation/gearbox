import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationAdminFetch } from "@/lib/tier-nation/upstream";
import { nextResponseFromUpstream } from "@/lib/tier-nation/proxy-response";

type RouteContext = { params: Promise<{ entityId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { entityId } = await context.params;
    const bodyText = await request.text();
    const upstream = await tierNationAdminFetch(`/admin/entities/${encodeURIComponent(entityId)}`, {
      method: "PATCH",
      body: bodyText,
    });
    return nextResponseFromUpstream(upstream);
  } catch (e) {
    console.error("[tier-nation:admin:entity:patch]", e);
    return NextResponse.json({ error: "Tier Nation service is unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { entityId } = await context.params;
    const upstream = await tierNationAdminFetch(`/admin/entities/${encodeURIComponent(entityId)}`, {
      method: "DELETE",
    });
    return nextResponseFromUpstream(upstream);
  } catch (e) {
    console.error("[tier-nation:admin:entity:delete]", e);
    return NextResponse.json({ error: "Tier Nation service is unavailable." }, { status: 503 });
  }
}
