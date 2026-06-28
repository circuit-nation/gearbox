import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { SportModel } from "@/lib/models/core.models";
import { buildListResponse, toDocument, toDocuments, type DocWithId } from "@/lib/mongo-helpers";
import { ENV } from "@/config/config";
import { parseStoredS3Value } from "@/lib/image-storage";
import { deleteS3Object } from "@/lib/s3-server";
import { buildSort } from "@/lib/circuit-nation/route-helpers";
import { sportSchema } from "@/lib/circuit-nation/validators";
import type { Sport } from "@/lib/circuit-nation/types";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const filterName = searchParams.get("filterName");
    const filterType = searchParams.get("filterType");

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid sport id." }, { status: 400 });
      }
      const document = await SportModel.findById(id).lean();
      if (!document) {
        return NextResponse.json({ error: "Sport not found." }, { status: 404 });
      }
      return NextResponse.json({
        data: toDocument<Sport>(document as DocWithId),
      });
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
        .sort(buildSort(sortBy, sortOrder as 1 | -1))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: buildListResponse(total, toDocuments<Sport>(documents as DocWithId[])),
    });
  } catch (error) {
    console.error("[sports:GET]", error);
    return NextResponse.json({ error: "Failed to fetch sports." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const parsed = sportSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sport payload." }, { status: 400 });
    }

    const document = await SportModel.create(parsed.data);
    return NextResponse.json(
      { data: toDocument<Sport>(document.toObject() as DocWithId) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[sports:POST]", error);
    return NextResponse.json({ error: "Failed to create sport." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as Partial<Sport> & { id?: string };
    const { id, ...data } = body;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid sport id." }, { status: 400 });
    }

    const parsed = sportSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sport payload." }, { status: 400 });
    }

    const document = await SportModel.findByIdAndUpdate(id, parsed.data, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!document) {
      return NextResponse.json({ error: "Sport not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: toDocument<Sport>(document as DocWithId),
    });
  } catch (error) {
    console.error("[sports:PUT]", error);
    return NextResponse.json({ error: "Failed to update sport." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid sport id." }, { status: 400 });
    }

    const existingSport = await SportModel.findById(id).lean();
    if (!existingSport) {
      return NextResponse.json({ error: "Sport not found." }, { status: 404 });
    }

    const logoLocation = parseStoredS3Value(String(existingSport.logo || ""), ENV.CN_S3_BUCKET);
    if (logoLocation) {
      await deleteS3Object(logoLocation);
    }

    await SportModel.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("[sports:DELETE]", error);
    return NextResponse.json({ error: "Failed to delete sport." }, { status: 500 });
  }
}
