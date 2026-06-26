import { NextRequest, NextResponse } from "next/server";
import { syncArticlesFromRss } from "@/lib/rss/sync-articles";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await syncArticlesFromRss();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("[internal:articles:sync]", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
