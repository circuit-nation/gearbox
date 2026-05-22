import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DriverModel } from "@/lib/models/core.models";
import { buildListResponse, toDocument, toDocuments, type DocWithId } from "@/lib/mongo-helpers";
import { ENV } from "@/config/config";
import { parseStoredS3Value } from "@/lib/image-storage";
import { deleteS3Object } from "@/lib/s3-server";
import { driverSchema } from "@/lib/circuit-nation/validators";
import { buildSort, isValidObjectId, parsePagination } from "@/lib/circuit-nation/route-helpers";
import type { Driver } from "@/lib/circuit-nation/types";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const { page, limit, sortBy: rawSortBy, sortOrder } = parsePagination(searchParams);
    const filterName = searchParams.get("filterName");
    const filterSport = searchParams.get("filterSport");
    const filterTeam = searchParams.get("filterTeam");

    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid driver id." }, { status: 400 });
      }

      const document = await DriverModel.findById(id).lean();
      if (!document) {
        return NextResponse.json({ error: "Driver not found." }, { status: 404 });
      }

      return NextResponse.json({
        data: toDocument<Driver>(document as DocWithId),
      });
    }

    const allowedSortFields = new Set([
      "createdAt",
      "updatedAt",
      "name",
      "sport_id",
      "team_id",
      "points",
    ]);
    const sortBy = allowedSortFields.has(rawSortBy) ? rawSortBy : "createdAt";

    const query: Record<string, unknown> = {};
    if (filterName) {
      query.name = { $regex: filterName, $options: "i" };
    }
    if (filterSport && isValidObjectId(filterSport)) {
      query.sport_id = filterSport;
    }
    if (filterTeam && isValidObjectId(filterTeam)) {
      query.team_id = filterTeam;
    }

    const [total, documents] = await Promise.all([
      DriverModel.countDocuments(query),
      DriverModel.find(query)
        .sort(buildSort(sortBy, sortOrder))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: buildListResponse(total, toDocuments<Driver>(documents as DocWithId[])),
    });
  } catch (error) {
    console.error("[drivers:GET]", error);
    return NextResponse.json({ error: "Failed to fetch drivers." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const parsed = driverSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid driver payload." }, { status: 400 });
    }

    const document = await DriverModel.create(parsed.data);
    return NextResponse.json(
      { data: toDocument<Driver>(document.toObject() as DocWithId) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[drivers:POST]", error);
    return NextResponse.json({ error: "Failed to create driver." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as Partial<Driver> & { id?: string };
    const { id, ...data } = body;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid driver id." }, { status: 400 });
    }

    const parsed = driverSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid driver payload." }, { status: 400 });
    }

    const document = await DriverModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!document) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: toDocument<Driver>(document as DocWithId),
    });
  } catch (error) {
    console.error("[drivers:PUT]", error);
    return NextResponse.json({ error: "Failed to update driver." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid driver id." }, { status: 400 });
    }

    const existingDriver = await DriverModel.findById(id).lean();
    if (!existingDriver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const imageLocation = parseStoredS3Value(
      String(existingDriver.image || ""),
      ENV.CN_S3_BUCKET
    );
    if (imageLocation) {
      await deleteS3Object(imageLocation);
    }

    await DriverModel.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("[drivers:DELETE]", error);
    return NextResponse.json({ error: "Failed to delete driver." }, { status: 500 });
  }
}
