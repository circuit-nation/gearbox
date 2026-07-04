import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CircuitModel } from "@/lib/models/core.models";
import { buildListResponse, toDocument, toDocuments, type DocWithId } from "@/lib/mongo-helpers";
import { ENV } from "@/config/config";
import { parseStoredS3Value } from "@/lib/image-storage";
import { deleteS3Object } from "@/lib/s3-server";
import { circuitSchema } from "@/lib/circuit-nation/validators";
import { buildSort, isValidObjectId, parsePagination } from "@/lib/circuit-nation/route-helpers";
import type { Circuit } from "@/lib/circuit-nation/types";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const filterName = searchParams.get("filterName");
    const filterSport = searchParams.get("filterSport");
    const filterCountry = searchParams.get("filterCountry");

    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid circuit id." }, { status: 400 });
      }

      const document = await CircuitModel.findById(id).lean();
      if (!document) {
        return NextResponse.json({ error: "Circuit not found." }, { status: 404 });
      }

      return NextResponse.json({
        data: toDocument<Circuit>(document as DocWithId),
      });
    }

    const query: Record<string, unknown> = {};
    if (filterName) {
      query.name = { $regex: filterName, $options: "i" };
    }
    if (filterSport && isValidObjectId(filterSport)) {
      query.sport_id = filterSport;
    }
    if (filterCountry) {
      query.country = { $regex: filterCountry, $options: "i" };
    }

    const [total, documents] = await Promise.all([
      CircuitModel.countDocuments(query),
      CircuitModel.find(query)
        .sort(buildSort(sortBy, sortOrder))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: buildListResponse(total, toDocuments<Circuit>(documents as DocWithId[])),
    });
  } catch (error) {
    console.error("[circuits:GET]", error);
    return NextResponse.json({ error: "Failed to fetch circuits." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const parsed = circuitSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid circuit payload." }, { status: 400 });
    }

    const document = await CircuitModel.create(parsed.data);
    return NextResponse.json(
      { data: toDocument<Circuit>(document.toObject() as DocWithId) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[circuits:POST]", error);
    return NextResponse.json({ error: "Failed to create circuit." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as Partial<Circuit> & { id?: string };
    const { id, ...data } = body;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid circuit id." }, { status: 400 });
    }

    const parsed = circuitSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid circuit payload." }, { status: 400 });
    }

    const document = await CircuitModel.findByIdAndUpdate(id, parsed.data, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!document) {
      return NextResponse.json({ error: "Circuit not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: toDocument<Circuit>(document as DocWithId),
    });
  } catch (error) {
    console.error("[circuits:PUT]", error);
    return NextResponse.json({ error: "Failed to update circuit." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid circuit id." }, { status: 400 });
    }

    const existingCircuit = await CircuitModel.findById(id).lean();
    if (!existingCircuit) {
      return NextResponse.json({ error: "Circuit not found." }, { status: 404 });
    }

    const imageLocation = parseStoredS3Value(
      String(existingCircuit.image || ""),
      ENV.CN_S3_BUCKET
    );
    if (imageLocation) {
      await deleteS3Object(imageLocation);
    }

    await CircuitModel.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("[circuits:DELETE]", error);
    return NextResponse.json({ error: "Failed to delete circuit." }, { status: 500 });
  }
}
