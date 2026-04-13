import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { SportModel } from "@/lib/models";
import { buildListResponse, toDocument, toDocuments } from "@/lib/mongo-helpers";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10"), 1);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = rawSortOrder === "asc" ? 1 : -1;
    const filterName = searchParams.get("filterName");
    const filterType = searchParams.get("filterType");

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json(null);
      }
      const document = await SportModel.findById(id).lean();
      return NextResponse.json(toDocument(document as any));
    }

    const query: Record<string, unknown> = {};

    if (filterName) {
      query.name = { $regex: filterName, $options: "i" };
    }

    if (filterType) {
      query.type = filterType;
    }

    const [total, documents] = await Promise.all([
      SportModel.countDocuments(query),
      SportModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      buildListResponse(total, toDocuments(documents as any[]))
    );
  } catch (error: any) {
    console.error("GET Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();

    const document = await SportModel.create(data);
    return NextResponse.json(toDocument(document.toObject() as any), { status: 201 });
  } catch (error: any) {
    console.error("POST Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sport" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { id, ...data } = body;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const document = await SportModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    return NextResponse.json(toDocument(document as any));
  } catch (error: any) {
    console.error("PUT Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sport" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    await SportModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete sport" },
      { status: 500 }
    );
  }
}
