import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationAdminFetch } from "@/lib/tier-nation/upstream";
import { persistTierNationEntitySubmissions } from "@/lib/tier-nation/persist-to-db";
import { nextResponseFromUpstream } from "@/lib/tier-nation/proxy-response";

type RouteContext = { params: Promise<{ listId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { listId } = await context.params;
    const bodyText = await request.text();
    const upstream = await tierNationAdminFetch(
      `/admin/lists/${encodeURIComponent(listId)}/entities`,
      {
        method: "POST",
        body: bodyText,
      }
    );

    if (upstream.ok && upstream.status === 200) {
      try {
        const req = JSON.parse(bodyText) as Record<string, unknown>;
        await persistTierNationEntitySubmissions(listId, "list", req);
      } catch {
        // ignore
      }
    }

    return nextResponseFromUpstream(upstream);
  } catch (e) {
    console.error("[tier-nation:admin:list:entities:add]", e);
    return NextResponse.json({ error: "Tier Nation service is unavailable." }, { status: 503 });
  }
}
