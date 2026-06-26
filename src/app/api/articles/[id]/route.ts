import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { ArticleModel } from "@/lib/models/article.models";
import { toDocument, type DocWithId } from "@/lib/mongo-helpers";
import type { Article } from "@/app/api/articles/route";

const updateArticleStatusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid article id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = updateArticleStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const updated = await ArticleModel.findByIdAndUpdate(
      id,
      { $set: { status: parsed.data.status } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: toDocument<Article>(updated as DocWithId),
    });
  } catch (error) {
    console.error("[articles:PATCH]", error);
    return NextResponse.json({ error: "Failed to update article." }, { status: 500 });
  }
}
