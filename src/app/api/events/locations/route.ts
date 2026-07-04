import { NextRequest, NextResponse } from "next/server";
import { verifyClientToken } from "@/lib/auth/client-token";
import {
  mapEventToLocation,
  parsePopulatedEvent,
} from "@/lib/events/globe-mapper";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/lib/models/core.models";

export async function GET(request: NextRequest) {
  const clientAuthError = verifyClientToken(request);
  if (clientAuthError) {
    return clientAuthError;
  }

  try {
    await connectToDatabase();

    const now = new Date();

    const documents = await EventModel.find({ event_end_at: { $gte: now } })
      .sort({ event_start_at: 1 })
      .populate("circuit_id")
      .lean();

    const data = documents
      .map((document) => parsePopulatedEvent(document as Record<string, unknown>))
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .map(mapEventToLocation)
      .filter((location): location is NonNullable<typeof location> => location !== null);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[events/locations:GET]", error);
    return NextResponse.json({ error: "Failed to fetch event locations." }, { status: 500 });
  }
}
