import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TeamModel } from "@/lib/models/core.models";
import { buildListResponse, toDocument, toDocuments, type DocWithId } from "@/lib/mongo-helpers";
import { ENV } from "@/config/config";
import { parseStoredS3Value } from "@/lib/image-storage";
import { deleteS3Object } from "@/lib/s3-server";
import { teamSchema } from "@/lib/circuit-nation/validators";
import { buildSort, isValidObjectId, parsePagination } from "@/lib/circuit-nation/route-helpers";
import type { Team } from "@/lib/circuit-nation/types";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const filterName = searchParams.get("filterName");
    const filterSport = searchParams.get("filterSport");

    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
      }

      const document = await TeamModel.findById(id).lean();
      if (!document) {
        return NextResponse.json({ error: "Team not found." }, { status: 404 });
      }

      return NextResponse.json({
        data: toDocument<Team>(document as DocWithId),
      });
    }

    const query: Record<string, unknown> = {};
    if (filterName) {
      query.name = { $regex: filterName, $options: "i" };
    }
    if (filterSport && isValidObjectId(filterSport)) {
      query.sport_id = filterSport;
    }

    const [total, documents] = await Promise.all([
      TeamModel.countDocuments(query),
      TeamModel.find(query)
        .sort(buildSort(sortBy, sortOrder))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: buildListResponse(total, toDocuments<Team>(documents as DocWithId[])),
    });
  } catch (error) {
    console.error("[teams:GET]", error);
    return NextResponse.json({ error: "Failed to fetch teams." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const parsed = teamSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid team payload." }, { status: 400 });
    }

    const document = await TeamModel.create(parsed.data);
    return NextResponse.json(
      { data: toDocument<Team>(document.toObject() as DocWithId) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[teams:POST]", error);
    return NextResponse.json({ error: "Failed to create team." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as Partial<Team> & { id?: string };
    const { id, ...data } = body;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
    }

    const parsed = teamSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid team payload." }, { status: 400 });
    }

    const document = await TeamModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!document) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    return NextResponse.json({ data: toDocument<Team>(document as DocWithId) });
  } catch (error) {
    console.error("[teams:PUT]", error);
    return NextResponse.json({ error: "Failed to update team." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
    }

    const existingTeam = await TeamModel.findById(id).lean();
    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const logoLocation = parseStoredS3Value(String(existingTeam.logo || ""), ENV.CN_S3_BUCKET);
    if (logoLocation) {
      await deleteS3Object(logoLocation);
    }

    await TeamModel.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("[teams:DELETE]", error);
    return NextResponse.json({ error: "Failed to delete team." }, { status: 500 });
  }
}
