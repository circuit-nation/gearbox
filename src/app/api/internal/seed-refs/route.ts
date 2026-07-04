import { NextRequest, NextResponse } from "next/server";
import { fetchSeedRefs } from "@/lib/events/seed-refs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchSeedRefs();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[internal:seed-refs]", error);
    return NextResponse.json({ error: "Failed to fetch seed refs" }, { status: 500 });
  }
}
