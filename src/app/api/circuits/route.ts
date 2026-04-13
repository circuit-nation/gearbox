import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { CircuitModel } from "@/lib/models";
import { buildListResponse, toDocument, toDocuments } from "@/lib/mongo-helpers";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10"), 1);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = rawSortOrder === "asc" ? 1 : -1;
    const filterName = searchParams.get("filterName");
    const filterCountry = searchParams.get("filterCountry");
    const filterSport = searchParams.get("filterSport");

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json(null);
      }
      const document = await CircuitModel.findById(id).lean();
      return NextResponse.json(toDocument(document as any));
    }

    if (ids) {
      const objectIds = ids
        .split(",")
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (!objectIds.length) {
        return NextResponse.json([]);
      }

      const documents = await CircuitModel.find({ _id: { $in: objectIds } }).lean();
      return NextResponse.json(toDocuments(documents as any[]));
    }

    const query: Record<string, unknown> = {};

    if (filterName) {
      query.name = { $regex: filterName, $options: "i" };
    }

    if (filterCountry) {
      query.$or = [
        { country: { $regex: filterCountry, $options: "i" } },
        { country_code: { $regex: filterCountry, $options: "i" } },
      ];
    }

    if (filterSport) {
      query.sport_id = filterSport;
    }

    const [total, documents] = await Promise.all([
      CircuitModel.countDocuments(query),
      CircuitModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      buildListResponse(total, toDocuments(documents as any[]))
    );
  } catch (error: any) {
    console.error("GET Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch circuits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();

    const document = await CircuitModel.create(data);
    return NextResponse.json(toDocument(document.toObject() as any), { status: 201 });
  } catch (error: any) {
    console.error("POST Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create circuit" },
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

    const document = await CircuitModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    return NextResponse.json(toDocument(document as any));
  } catch (error: any) {
    console.error("PUT Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update circuit" },
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

    await CircuitModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE Circuits API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete circuit" },
      { status: 500 }
    );
  }
}
