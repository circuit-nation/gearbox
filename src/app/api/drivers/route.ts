import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { DriverModel } from "@/lib/models";
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
    const filterSport = searchParams.get("filterSport");

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json(null);
      }
      const document = await DriverModel.findById(id).lean();
      return NextResponse.json(toDocument(document as any));
    }

    const query: Record<string, unknown> = {};

    if (filterName) {
      query.name = { $regex: filterName, $options: "i" };
    }

    if (filterSport) {
      query.sport = filterSport;
    }

    const [total, documents] = await Promise.all([
      DriverModel.countDocuments(query),
      DriverModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      buildListResponse(total, toDocuments(documents as any[]))
    );
  } catch (error: any) {
    console.error("GET Drivers API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();

    const document = await DriverModel.create(data);
    return NextResponse.json(toDocument(document.toObject() as any), { status: 201 });
  } catch (error: any) {
    console.error("POST Drivers API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create driver" },
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

    const document = await DriverModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    return NextResponse.json(toDocument(document as any));
  } catch (error: any) {
    console.error("PUT Drivers API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update driver" },
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

    await DriverModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE Drivers API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete driver" },
      { status: 500 }
    );
  }
}
