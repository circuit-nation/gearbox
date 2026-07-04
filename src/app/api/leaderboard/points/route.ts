import { NextRequest, NextResponse } from "next/server";
import { DriverLeaderboardModel } from "@/lib/models/leaderboard.models";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeDriverLeaderboardEntry } from "@/lib/circuit-nation/leaderboard-serializer";
import { isValidObjectId } from "@/lib/circuit-nation/route-helpers";
import type { DriverLeaderboardEntry } from "@/lib/circuit-nation/types";

type UpdateMode = "add" | "set";

function isValidMode(value: string): value is UpdateMode {
  return value === "add" || value === "set";
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = (await request.json()) as {
      id?: string;
      mode?: string;
      value?: number;
    };

    const id = body.id;
    const mode = body.mode;
    const value = Number(body.value);

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid leaderboard entry id." }, { status: 400 });
    }
    if (!mode || !isValidMode(mode)) {
      return NextResponse.json({ error: "Invalid points update mode." }, { status: 400 });
    }
    if (!Number.isFinite(value)) {
      return NextResponse.json({ error: "Invalid points value." }, { status: 400 });
    }

    const existing = await DriverLeaderboardModel.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
    }

    const currentPoints =
      typeof existing.stats === "object" && existing.stats && "points" in existing.stats
        ? Number(existing.stats.points || 0)
        : 0;
    const nextPoints = mode === "add" ? currentPoints + value : value;

    const document = await DriverLeaderboardModel.findByIdAndUpdate(
      id,
      { "stats.points": nextPoints },
      { returnDocument: "after", runValidators: true }
    )
      .populate([
        { path: "driver_id", select: "name image" },
        { path: "team_id", select: "name" },
        { path: "sport_id", select: "name" },
      ])
      .lean();

    if (!document) {
      return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: serializeDriverLeaderboardEntry(
        document as Record<string, unknown>
      ) as DriverLeaderboardEntry,
    });
  } catch (error) {
    console.error("[leaderboard:points:PUT]", error);
    return NextResponse.json({ error: "Failed to update driver points." }, { status: 500 });
  }
}
