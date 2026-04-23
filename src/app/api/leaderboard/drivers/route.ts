import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DriverModel } from "@/lib/models";
import { buildListResponse } from "@/lib/mongo-helpers";

type DriverLeaderboardDocument = {
  _id: string;
  id: string;
  name: string;
  image: string;
  sport: string;
  tags?: string[];
  team: string;
  points: number;
  rank: number;
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10"), 1);
    const rawSortBy = searchParams.get("sortBy") || "points";
    const rawSortOrder = searchParams.get("sortOrder");
    const filterName = searchParams.get("filterName");
    const filterSport = searchParams.get("filterSport");
    const filterTeam = searchParams.get("filterTeam");

    const sortOrder = rawSortOrder === "asc" ? 1 : -1;
    const allowedSortFields = new Set(["points", "name", "team"]);
    const sortBy = allowedSortFields.has(rawSortBy) ? rawSortBy : "points";

    const query: Record<string, unknown> = {};

    if (filterName) {
      query.name = { $regex: filterName, $options: "i" };
    }

    if (filterSport) {
      query.sport = filterSport;
    }

    if (filterTeam) {
      query.team = { $regex: filterTeam, $options: "i" };
    }

    const sortStage: Record<string, 1 | -1> =
      sortBy === "name"
        ? { name: sortOrder, points: -1 }
        : sortBy === "team"
          ? { teamNormalized: sortOrder, pointsNormalized: -1, name: 1 }
          : { pointsNormalized: sortOrder, name: 1 };

    const [result] = await DriverModel.aggregate([
      { $match: query },
      {
        $addFields: {
          pointsNormalized: { $ifNull: ["$points", 0] },
          teamNormalized: { $ifNull: ["$team", ""] },
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          meta: [{ $count: "total" }],
          documents: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                id: 1,
                name: 1,
                image: 1,
                sport: 1,
                tags: 1,
                team: "$teamNormalized",
                points: "$pointsNormalized",
              },
            },
          ],
        },
      },
    ]);

    const total = result?.meta?.[0]?.total || 0;
    const rankOffset = (page - 1) * limit;
    const documents: DriverLeaderboardDocument[] = (result?.documents || []).map(
      (document: Record<string, unknown>, index: number) => ({
        _id: String(document._id),
        id: String(document.id || ""),
        name: String(document.name || ""),
        image: String(document.image || ""),
        sport: String(document.sport || ""),
        tags: (document.tags as string[] | undefined) || [],
        team: String(document.team || ""),
        points: Number(document.points || 0),
        rank: rankOffset + index + 1,
      })
    );

    return NextResponse.json(buildListResponse(total, documents));
  } catch (error: any) {
    console.error("GET Leaderboard Drivers API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch driver leaderboard" },
      { status: 500 }
    );
  }
}
