import { NextRequest, NextResponse } from "next/server";
import type { PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { DriverModel } from "@/lib/models";
import { buildListResponse } from "@/lib/mongo-helpers";

type TeamLeaderboardDocument = {
  team: string;
  totalPoints: number;
  driverCount: number;
  rank: number;
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10"), 1);
    const rawSortBy = searchParams.get("sortBy") || "totalPoints";
    const rawSortOrder = searchParams.get("sortOrder");
    const filterSport = searchParams.get("filterSport");
    const filterTeam = searchParams.get("filterTeam");

    const sortOrder = rawSortOrder === "asc" ? 1 : -1;
    const allowedSortFields = new Set(["totalPoints", "team", "driverCount"]);
    const sortBy = allowedSortFields.has(rawSortBy) ? rawSortBy : "totalPoints";

    const query: Record<string, unknown> = {};

    if (filterSport) {
      query.sport = filterSport;
    }

    const sortStage: Record<string, 1 | -1> =
      sortBy === "team"
        ? { team: sortOrder, totalPoints: -1 }
        : sortBy === "driverCount"
          ? { driverCount: sortOrder, totalPoints: -1, team: 1 }
          : { totalPoints: sortOrder, team: 1 };

    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          pointsNormalized: { $ifNull: ["$points", 0] },
          teamNormalized: {
            $let: {
              vars: {
                trimmedTeam: {
                  $trim: {
                    input: { $ifNull: ["$team", ""] },
                  },
                },
              },
              in: {
                $cond: [{ $eq: ["$$trimmedTeam", ""] }, "Unassigned", "$$trimmedTeam"],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$teamNormalized",
          totalPoints: { $sum: "$pointsNormalized" },
          driverCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          team: "$_id",
          totalPoints: 1,
          driverCount: 1,
        },
      },
    ];

    if (filterTeam) {
      pipeline.push({
        $match: { team: { $regex: filterTeam, $options: "i" } },
      });
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({
      $facet: {
        meta: [{ $count: "total" }],
        documents: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    });

    const [result] = await DriverModel.aggregate(pipeline);
    const total = result?.meta?.[0]?.total || 0;
    const rankOffset = (page - 1) * limit;

    const documents: TeamLeaderboardDocument[] = (result?.documents || []).map(
      (document: Record<string, unknown>, index: number) => ({
        team: String(document.team || "Unassigned"),
        totalPoints: Number(document.totalPoints || 0),
        driverCount: Number(document.driverCount || 0),
        rank: rankOffset + index + 1,
      })
    );

    return NextResponse.json(buildListResponse(total, documents));
  } catch (error: any) {
    console.error("GET Leaderboard Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch team leaderboard" },
      { status: 500 }
    );
  }
}
