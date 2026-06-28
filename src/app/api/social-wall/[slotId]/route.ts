import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardSession } from "@/lib/auth/require-dashboard-session";
import { connectToDatabase } from "@/lib/mongodb";
import { SocialWallSlotModel } from "@/lib/models/social-wall.models";
import { toDocument, type DocWithId } from "@/lib/mongo-helpers";
import {
  inferPlatformFromSlotId,
  isSocialWallSlotId,
  type SocialWallSlotId,
} from "@/lib/social-wall/slots";
import type { SocialWallSlot } from "@/app/api/social-wall/route";

const updateSocialWallSlotSchema = z.object({
  platform: z.enum(["yt", "reddit", "ig", "substack"]).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  hasPlay: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const unauthorized = await requireDashboardSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { slotId } = await params;

  if (!isSocialWallSlotId(slotId)) {
    return NextResponse.json({ error: "Invalid slot id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = updateSocialWallSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const update = {
      slotId: slotId as SocialWallSlotId,
      platform: parsed.data.platform ?? inferPlatformFromSlotId(slotId),
      title: parsed.data.title ?? "",
      subtitle: parsed.data.subtitle ?? "",
      url: parsed.data.url ?? "",
      thumbnailUrl: parsed.data.thumbnailUrl ?? "",
      hasPlay: parsed.data.hasPlay ?? false,
      isActive: parsed.data.isActive ?? false,
    };

    const updated = await SocialWallSlotModel.findOneAndUpdate(
      { slotId },
      { $set: update },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      data: toDocument<SocialWallSlot>(updated as DocWithId),
    });
  } catch (error) {
    console.error("[social-wall:PUT]", error);
    return NextResponse.json({ error: "Failed to update social wall slot." }, { status: 500 });
  }
}
