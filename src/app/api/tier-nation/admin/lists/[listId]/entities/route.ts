import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationAdminFetch } from "@/lib/tier-nation/upstream";
import { persistTierNationEntitySubmissions } from "@/lib/tier-nation/persist-to-db";

type RouteContext = { params: Promise<{ listId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const { listId } = await context.params;
    const bodyText = await request.text();
    const upstream = await tierNationAdminFetch(`/admin/lists/${encodeURIComponent(listId)}/entities`, {
      method: "POST",
      body: bodyText,
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";

    if (upstream.ok && upstream.status === 200) {
      try {
        const req = JSON.parse(bodyText) as Record<string, unknown>;
        await persistTierNationEntitySubmissions(listId, "list", req);
      } catch {
        // ignore
      }
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Proxy failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
