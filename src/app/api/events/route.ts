import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * GET /api/events - Fetch all events or a single event by ID
 * Query params:
 * - id: (optional) document ID for single document fetch
 * - page: (optional) page number for pagination (default: 1)
 * - limit: (optional) items per page (default: 10)
 * - sortBy: (optional) field to sort by (default: "event_start_at")
 * - sortOrder: (optional) "asc" or "desc" (default: "desc")
 * - filterTitle: (optional) filter by title (partial match)
 * - filterType: (optional) filter by type
 * - filterCircuitId: (optional) filter by circuit document ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "event_start_at";
    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = rawSortOrder === "asc" || rawSortOrder === "desc" ? rawSortOrder : "desc";
    const filterTitle = searchParams.get("filterTitle");
    const filterType = searchParams.get("filterType");
    const filterCircuitId = searchParams.get("filterCircuitId");

    const client = getConvexClient();

    // Fetch single document if ID is provided
    if (documentId) {
      const document = await client.query(api.events.get, {
        id: documentId as Id<"events">,
      });
      return NextResponse.json(document);
    }

    const documents = await client.query(api.events.list, {
      page,
      limit,
      sortBy,
      sortOrder,
      filterTitle: filterTitle || undefined,
      filterType: filterType || undefined,
      filterCircuitId: filterCircuitId || undefined,
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/events - Create a new event
 * Body should include event data matching the schema
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const client = getConvexClient();

    const document = await client.mutation(api.events.create, { data });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: error.code || 500 }
    );
  }
}

/**
 * PUT /api/events - Update an existing event
 * Body should include:
 * - id: document ID
 * - data: updated event data
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const client = getConvexClient();

    const document = await client.mutation(api.events.update, {
      id: id as Id<"events">,
      data,
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error("PUT Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
      { status: error.code || 500 }
    );
  }
}

/**
 * DELETE /api/events - Delete an event
 * Query params:
 * - id: document ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const client = getConvexClient();

    await client.mutation(api.events.remove, {
      id: documentId as Id<"events">,
    });

    return NextResponse.json({ success: true, id: documentId });
  } catch (error: any) {
    console.error("DELETE Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: error.code || 500 }
    );
  }
}
