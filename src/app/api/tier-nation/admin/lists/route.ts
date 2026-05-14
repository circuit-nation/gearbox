import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationAdminFetch } from "@/lib/tier-nation/upstream";
import { persistTierNationListSubmission } from "@/lib/tier-nation/persist-to-db";

export async function POST(request: NextRequest) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }
  try {
    const bodyText = await request.text();
    const upstream = await tierNationAdminFetch("/admin/lists", {
      method: "POST",
      body: bodyText,
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";

    if (upstream.status === 201) {
      try {
        const created = JSON.parse(text) as { id: string; name?: string };
        const req = JSON.parse(bodyText) as Record<string, unknown>;
        await persistTierNationListSubmission(req, created);
      } catch {
        // Ignore JSON / persistence errors; client still receives upstream body.
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
