import { NextRequest, NextResponse } from "next/server";
import { DriverLeaderboardModel } from "@/lib/models/leaderboard.models";
import { connectToDatabase } from "@/lib/mongodb";
import { buildListResponse } from "@/lib/mongo-helpers";
import { serializeDriverLeaderboardEntry } from "@/lib/circuit-nation/leaderboard-serializer";
import { driverLeaderboardSchema } from "@/lib/circuit-nation/validators";
import {
  buildSort,
  isValidObjectId,
  parsePagination,
  parseYear,
} from "@/lib/circuit-nation/route-helpers";
import type { DriverLeaderboardEntry } from "@/lib/circuit-nation/types";

const populateFields = [
  { path: "driver_id", select: "name image" },
  { path: "team_id", select: "name" },
  { path: "sport_id", select: "name" },
];

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const { page, limit, sortBy: rawSortBy, sortOrder } = parsePagination(searchParams);
    const filterYear = parseYear(searchParams);
    const filterName = searchParams.get("filterName");
    const filterSport = searchParams.get("filterSport");
    const filterTeam = searchParams.get("filterTeam");

    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid leaderboard entry id." }, { status: 400 });
      }

      const document = await DriverLeaderboardModel.findById(id).populate(populateFields).lean();
      if (!document) {
        return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
      }

      return NextResponse.json({
        data: serializeDriverLeaderboardEntry(document as Record<string, unknown>),
      });
    }

    const allowedSortFields = new Set(["rank", "points", "year", "createdAt"]);
    const sortBy = allowedSortFields.has(rawSortBy) ? rawSortBy : "rank";
    const sortField =
      sortBy === "points" ? "stats.points" : sortBy === "rank" ? "stats.rank" : sortBy;

    const query: Record<string, unknown> = { year: filterYear };
    if (filterSport && isValidObjectId(filterSport)) {
      query.sport_id = filterSport;
    }
    if (filterTeam && isValidObjectId(filterTeam)) {
      query.team_id = filterTeam;
    }

    let documents = await DriverLeaderboardModel.find(query)
      .populate(populateFields)
      .sort(buildSort(sortField, sortOrder))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (filterName) {
      const normalized = filterName.toLowerCase();
      documents = documents.filter((document) => {
        const driver = document.driver_id as { name?: string } | null;
        return driver?.name?.toLowerCase().includes(normalized);
      });
    }

    const total = filterName
      ? documents.length
      : await DriverLeaderboardModel.countDocuments(query);

    const serialized = documents
      .map((document) => serializeDriverLeaderboardEntry(document as Record<string, unknown>))
      .filter((document) => document !== null) as DriverLeaderboardEntry[];

    return NextResponse.json({ data: buildListResponse(total, serialized) });
  } catch (error) {
    console.error("[leaderboard:drivers:GET]", error);
    return NextResponse.json({ error: "Failed to fetch driver leaderboard." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const parsed = driverLeaderboardSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid driver leaderboard payload." }, { status: 400 });
    }

    const document = await DriverLeaderboardModel.create(parsed.data);
    const populated = await DriverLeaderboardModel.findById(document._id)
      .populate(populateFields)
      .lean();

    return NextResponse.json(
      {
        data: serializeDriverLeaderboardEntry(
          (populated ?? document.toObject()) as Record<string, unknown>
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[leaderboard:drivers:POST]", error);
    return NextResponse.json(
      { error: "Failed to create driver leaderboard entry." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as Record<string, unknown> & {
      id?: string;
    };
    const { id, ...data } = body;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid leaderboard entry id." }, { status: 400 });
    }

    const parsed = driverLeaderboardSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid driver leaderboard payload." }, { status: 400 });
    }

    const document = await DriverLeaderboardModel.findByIdAndUpdate(id, parsed.data, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate(populateFields)
      .lean();

    if (!document) {
      return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: serializeDriverLeaderboardEntry(document as Record<string, unknown>),
    });
  } catch (error) {
    console.error("[leaderboard:drivers:PUT]", error);
    return NextResponse.json(
      { error: "Failed to update driver leaderboard entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid leaderboard entry id." }, { status: 400 });
    }

    const document = await DriverLeaderboardModel.findByIdAndDelete(id);
    if (!document) {
      return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("[leaderboard:drivers:DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete driver leaderboard entry." },
      { status: 500 }
    );
  }
}
