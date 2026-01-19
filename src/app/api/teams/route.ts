import { NextRequest, NextResponse } from "next/server";
import { getAppwriteDatabase, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "node-appwrite";

/**
 * GET /api/teams - Fetch all teams or a single team by ID
 * Query params:
 * - id: (optional) document ID for single document fetch
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");

    const database = getAppwriteDatabase();

    // Fetch single document if ID is provided
    if (documentId) {
      const document = await database.getDocument(
        DATABASE_ID,
        COLLECTIONS.TEAMS,
        documentId
      );
      return NextResponse.json(document);
    }

    // Fetch list of documents
    const documents = await database.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAMS,
      [Query.orderDesc("$createdAt")]
    );

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch teams" },
      { status: error.code || 500 }
    );
  }
}

/**
 * POST /api/teams - Create a new team
 * Body should include team data matching the schema
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const database = getAppwriteDatabase();

    const document = await database.createDocument(
      DATABASE_ID,
      COLLECTIONS.TEAMS,
      "unique()",
      data
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create team" },
      { status: error.code || 500 }
    );
  }
}

/**
 * PUT /api/teams - Update an existing team
 * Body should include:
 * - id: document ID
 * - data: updated team data
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

    const database = getAppwriteDatabase();

    const document = await database.updateDocument(
      DATABASE_ID,
      COLLECTIONS.TEAMS,
      id,
      data
    );

    return NextResponse.json(document);
  } catch (error: any) {
    console.error("PUT Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update team" },
      { status: error.code || 500 }
    );
  }
}

/**
 * DELETE /api/teams - Delete a team
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

    const database = getAppwriteDatabase();

    await database.deleteDocument(DATABASE_ID, COLLECTIONS.TEAMS, documentId);

    return NextResponse.json({ success: true, id: documentId });
  } catch (error: any) {
    console.error("DELETE Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete team" },
      { status: error.code || 500 }
    );
  }
}
