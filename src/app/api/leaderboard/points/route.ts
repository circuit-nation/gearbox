import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { DriverModel } from "@/lib/models";
import { toDocument } from "@/lib/mongo-helpers";

type UpdateMode = "add" | "set";

function isValidMode(value: string): value is UpdateMode {
  return value === "add" || value === "set";
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const id = body?.id;
    const mode = body?.mode;
    const value = Number(body?.value);

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid driver id is required" }, { status: 400 });
    }

    if (!isValidMode(mode)) {
      return NextResponse.json({ error: "mode must be either 'add' or 'set'" }, { status: 400 });
    }

    if (!Number.isFinite(value)) {
      return NextResponse.json({ error: "value must be a valid number" }, { status: 400 });
    }

    const existing = await DriverModel.findById(id).lean();

    if (!existing) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const currentPoints = typeof existing.points === "number" ? existing.points : 0;
    const nextPoints = mode === "add" ? currentPoints + value : value;

    const document = await DriverModel.findByIdAndUpdate(
      id,
      { points: nextPoints },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json(toDocument(document as any));
  } catch (error: any) {
    console.error("PUT Leaderboard Points API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update driver points" },
      { status: 500 }
    );
  }
}
