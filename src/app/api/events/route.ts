import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/lib/models";
import { buildListResponse, toDocument, toDocuments } from "@/lib/mongo-helpers";
import { storedValueToS3Key } from "@/lib/image-storage";
import { deleteS3ObjectByKey } from "@/lib/s3-server";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10"), 1);
    const sortBy = searchParams.get("sortBy") || "event_start_at";
    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = rawSortOrder === "asc" ? 1 : -1;
    const filterTitle = searchParams.get("filterTitle");
    const filterType = searchParams.get("filterType");

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json(null);
      }
      const document = await EventModel.findById(id).lean();
      return NextResponse.json(toDocument(document as any));
    }

    const query: Record<string, unknown> = {};

    if (filterTitle) {
      query.title = { $regex: filterTitle, $options: "i" };
    }

    if (filterType) {
      query.type = filterType;
    }

    const [total, documents] = await Promise.all([
      EventModel.countDocuments(query),
      EventModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      buildListResponse(total, toDocuments(documents as any[]))
    );
  } catch (error: any) {
    console.error("GET Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();

    const document = await EventModel.create(data);
    return NextResponse.json(toDocument(document.toObject() as any), { status: 201 });
  } catch (error: any) {
    console.error("POST Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
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

    const document = await EventModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    return NextResponse.json(toDocument(document as any));
  } catch (error: any) {
    console.error("PUT Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
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

    const existingEvent = await EventModel.findById(id).lean();

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const imageKeys: string[] = Array.from(
      new Set(
        (existingEvent.images || [])
          .map((image: unknown) => storedValueToS3Key(String(image || "")))
          .filter((key: string | null): key is string => Boolean(key))
      )
    );

    await Promise.all(imageKeys.map((key: string) => deleteS3ObjectByKey(key)));

    await EventModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}
