import { NextRequest, NextResponse } from "next/server";
import { verifyClientToken } from "@/lib/auth/client-token";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";
import { verifyAdminSessionToken } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { ArticleModel } from "@/lib/models/article.models";
import { buildListResponse, toDocuments, type DocWithId } from "@/lib/mongo-helpers";

export type Article = {
  _id: string;
  guid: string;
  url: string;
  title: string;
  excerpt: string;
  thumbnail: string;
  publishedAt: string;
  status: "draft" | "published";
  syncedAt: string;
};

export async function GET(request: NextRequest) {
  const clientAuthError = verifyClientToken(request);

  if (!clientAuthError) {
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 5), 20);
    await connectToDatabase();

    const data = toDocuments<Article>(
      (await ArticleModel.find({ status: "published" })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean()) as DocWithId[]
    );

    return NextResponse.json({ data });
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSessionToken(sessionToken);
  if (!session) {
    return clientAuthError;
  }

  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "25", 10), 1);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status === "draft" || status === "published") {
      query.status = status;
    }

    const [total, documents] = await Promise.all([
      ArticleModel.countDocuments(query),
      ArticleModel.find(query)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: buildListResponse(total, toDocuments<Article>(documents as DocWithId[])),
    });
  } catch (error) {
    console.error("[articles:GET]", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
