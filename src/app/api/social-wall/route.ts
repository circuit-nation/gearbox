import { NextRequest, NextResponse } from "next/server";
import { verifyClientToken } from "@/lib/auth/client-token";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";
import { verifyAdminSessionToken } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { SocialWallSlotModel } from "@/lib/models/social-wall.models";
import { toDocuments, type DocWithId } from "@/lib/mongo-helpers";
import { sortSlotsByOrder, type SocialWallSlotId } from "@/lib/social-wall/slots";

export type SocialWallSlot = {
  _id: string;
  slotId: SocialWallSlotId;
  platform: "yt" | "reddit" | "ig" | "substack";
  title: string;
  subtitle: string;
  url: string;
  thumbnailUrl: string;
  hasPlay: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function GET(request: NextRequest) {
  const clientAuthError = verifyClientToken(request);

  if (!clientAuthError) {
    try {
      await connectToDatabase();

      const documents = toDocuments<SocialWallSlot>(
        (await SocialWallSlotModel.find({ isActive: true }).lean()) as DocWithId[]
      );

      return NextResponse.json({ data: sortSlotsByOrder(documents) });
    } catch (error) {
      console.error("[social-wall:GET:public]", error);
      return NextResponse.json({ error: "Failed to fetch social wall slots" }, { status: 500 });
    }
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSessionToken(sessionToken);
  if (!session) {
    return clientAuthError;
  }

  try {
    await connectToDatabase();

    const documents = toDocuments<SocialWallSlot>(
      (await SocialWallSlotModel.find({}).lean()) as DocWithId[]
    );

    return NextResponse.json({ data: sortSlotsByOrder(documents) });
  } catch (error) {
    console.error("[social-wall:GET:admin]", error);
    return NextResponse.json({ error: "Failed to fetch social wall slots" }, { status: 500 });
  }
}
