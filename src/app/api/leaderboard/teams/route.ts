import { NextRequest, NextResponse } from "next/server";
import { TeamLeaderboardModel } from "@/lib/models/leaderboard.models";
import { connectToDatabase } from "@/lib/mongodb";
import { buildListResponse } from "@/lib/mongo-helpers";
import { serializeTeamLeaderboardEntry } from "@/lib/circuit-nation/leaderboard-serializer";
import { teamLeaderboardSchema } from "@/lib/circuit-nation/validators";
import {
  buildSort,
  isValidObjectId,
  parsePagination,
  parseYear,
} from "@/lib/circuit-nation/route-helpers";
import type { TeamLeaderboardEntry } from "@/lib/circuit-nation/types";

const populateFields = [
  { path: "team_id", select: "name logo" },
  { path: "sport_id", select: "name" },
];

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const { page, limit, sortBy: rawSortBy, sortOrder } = parsePagination(searchParams);
    const filterYear = parseYear(searchParams);
    const filterSport = searchParams.get("filterSport");
    const filterTeam = searchParams.get("filterTeam");

    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid leaderboard entry id." }, { status: 400 });
      }

      const document = await TeamLeaderboardModel.findById(id).populate(populateFields).lean();
      if (!document) {
        return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
      }

      return NextResponse.json({
        data: serializeTeamLeaderboardEntry(document as Record<string, unknown>),
      });
    }

    const allowedSortFields = new Set(["rank", "totalPoints", "year", "createdAt"]);
    const sortBy = allowedSortFields.has(rawSortBy) ? rawSortBy : "rank";
    const sortField =
      sortBy === "totalPoints" ? "stats.points" : sortBy === "rank" ? "stats.rank" : sortBy;

    const query: Record<string, unknown> = { year: filterYear };
    if (filterSport && isValidObjectId(filterSport)) {
      query.sport_id = filterSport;
    }

    let documents = await TeamLeaderboardModel.find(query)
      .populate(populateFields)
      .sort(buildSort(sortField, sortOrder))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (filterTeam) {
      const normalized = filterTeam.toLowerCase();
      documents = documents.filter((document) => {
        const team = document.team_id as { name?: string } | null;
        return team?.name?.toLowerCase().includes(normalized);
      });
    }

    const total = filterTeam ? documents.length : await TeamLeaderboardModel.countDocuments(query);

    const serialized = documents
      .map((document) => serializeTeamLeaderboardEntry(document as Record<string, unknown>))
      .filter((document) => document !== null) as TeamLeaderboardEntry[];

    return NextResponse.json({ data: buildListResponse(total, serialized) });
  } catch (error) {
    console.error("[leaderboard:teams:GET]", error);
    return NextResponse.json({ error: "Failed to fetch team leaderboard." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const parsed = teamLeaderboardSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid team leaderboard payload." }, { status: 400 });
    }

    const document = await TeamLeaderboardModel.create(parsed.data);
    const populated = await TeamLeaderboardModel.findById(document._id)
      .populate(populateFields)
      .lean();

    return NextResponse.json(
      {
        data: serializeTeamLeaderboardEntry(
          (populated ?? document.toObject()) as Record<string, unknown>
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[leaderboard:teams:POST]", error);
    return NextResponse.json(
      { error: "Failed to create team leaderboard entry." },
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

    const parsed = teamLeaderboardSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid team leaderboard payload." }, { status: 400 });
    }

    const document = await TeamLeaderboardModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    })
      .populate(populateFields)
      .lean();

    if (!document) {
      return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: serializeTeamLeaderboardEntry(document as Record<string, unknown>),
    });
  } catch (error) {
    console.error("[leaderboard:teams:PUT]", error);
    return NextResponse.json(
      { error: "Failed to update team leaderboard entry." },
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

    const document = await TeamLeaderboardModel.findByIdAndDelete(id);
    if (!document) {
      return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("[leaderboard:teams:DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete team leaderboard entry." },
      { status: 500 }
    );
  }
}
