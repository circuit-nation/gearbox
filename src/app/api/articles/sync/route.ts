import { NextResponse } from "next/server";
import { syncArticlesFromRss } from "@/lib/rss/sync-articles";

export async function POST() {
  try {
    const stats = await syncArticlesFromRss();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("[articles:sync]", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
