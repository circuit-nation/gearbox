import { NextRequest, NextResponse } from "next/server";
import { verifyClientToken } from "@/lib/auth/client-token";
import {
  mapEventToGlobeEvent,
  parsePopulatedEvent,
} from "@/lib/events/globe-mapper";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/lib/models/core.models";

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 10;

function parseLimit(value: string | null) {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  const clientAuthError = verifyClientToken(request);
  if (clientAuthError) {
    return clientAuthError;
  }

  try {
    await connectToDatabase();

    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const now = new Date();

    const documents = await EventModel.find({ event_end_at: { $gte: now } })
      .sort({ event_start_at: 1 })
      .limit(limit)
      .populate("sport_id")
      .populate("circuit_id")
      .populate("links_id")
      .lean();

    const data = documents
      .map((document) => parsePopulatedEvent(document as Record<string, unknown>))
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .map(mapEventToGlobeEvent);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[events/upcoming:GET]", error);
    return NextResponse.json({ error: "Failed to fetch upcoming events." }, { status: 500 });
  }
}
