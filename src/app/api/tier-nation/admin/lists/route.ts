import { NextRequest, NextResponse } from "next/server";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { tierNationAdminFetch } from "@/lib/tier-nation/upstream";
import { persistTierNationListSubmission } from "@/lib/tier-nation/persist-to-db";
import { nextResponseFromUpstream } from "@/lib/tier-nation/proxy-response";

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
    const text = await upstream.clone().text();

    if (upstream.status === 201) {
      try {
        const created = JSON.parse(text) as { id: string; name?: string };
        const req = JSON.parse(bodyText) as Record<string, unknown>;
        await persistTierNationListSubmission(req, created);
      } catch (e) {
        console.error("[tier-nation:admin:lists:create]", e);
      }
    }

    return nextResponseFromUpstream(upstream);
  } catch (e) {
    console.error("[tier-nation:admin:lists:create]", e);
    return NextResponse.json({ error: "Tier Nation service is unavailable." }, { status: 503 });
  }
}
