import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * GET /api/circuits - Fetch all circuits or a single circuit by ID
 * Query params:
 * - id: (optional) document ID for single document fetch
 * - page: (optional) page number for pagination (default: 1)
 * - limit: (optional) items per page (default: 10)
 * - sortBy: (optional) field to sort by (default: "_creationTime")
 * - sortOrder: (optional) "asc" or "desc" (default: "desc")
 * - filterName: (optional) filter by name (partial match)
 * - filterCountry: (optional) filter by country or country code
 * - filterSport: (optional) filter by sport ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "_creationTime";
    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = rawSortOrder === "asc" || rawSortOrder === "desc" ? rawSortOrder : "desc";
    const filterName = searchParams.get("filterName");
    const filterCountry = searchParams.get("filterCountry");
    const filterSport = searchParams.get("filterSport");

    const client = getConvexClient();

    if (documentId) {
      const document = await client.query(api.circuits.get, {
        id: documentId as Id<"circuits">,
      });
      return NextResponse.json(document);
    }

    const documents = await client.query(api.circuits.list, {
      page,
      limit,
      sortBy,
      sortOrder,
      filterName: filterName || undefined,
      filterCountry: filterCountry || undefined,
      filterSport: filterSport || undefined,
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch circuits" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/circuits - Create a new circuit
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const client = getConvexClient();

    const document = await client.mutation(api.circuits.create, { data });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create circuit" },
      { status: error.code || 500 }
    );
  }
}

/**
 * PUT /api/circuits - Update an existing circuit
 * Body should include:
 * - id: document ID
 * - data: updated circuit data
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

    const document = await client.mutation(api.circuits.update, {
      id: id as Id<"circuits">,
      data,
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error("PUT Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update circuit" },
      { status: error.code || 500 }
    );
  }
}

/**
 * DELETE /api/circuits - Delete a circuit
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

    await client.mutation(api.circuits.remove, {
      id: documentId as Id<"circuits">,
    });

    return NextResponse.json({ success: true, id: documentId });
  } catch (error: any) {
    console.error("DELETE Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete circuit" },
      { status: error.code || 500 }
    );
  }
}
