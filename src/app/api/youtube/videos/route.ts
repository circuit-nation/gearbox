import { NextRequest, NextResponse } from "next/server";
import { verifyClientToken } from "@/lib/auth/client-token";
import { getYoutubeConfig } from "@/lib/youtube/config";
import { parseVideoFormat } from "@/lib/youtube/format";
import { parseVideoLimit } from "@/lib/youtube/parse-limit";
import { getLatestVideos } from "@/lib/youtube/service";
import type { YoutubeVideosResponse } from "@/lib/youtube/types";

export async function GET(request: NextRequest) {
  const clientAuthError = verifyClientToken(request);
  if (clientAuthError) {
    return clientAuthError;
  }

  let config;
  try {
    config = getYoutubeConfig();
  } catch (error) {
    console.error("[youtube:videos:GET] config error:", error);
    return NextResponse.json(
      { error: "YouTube API is not configured", data: [] } satisfies YoutubeVideosResponse & {
        error: string;
      },
      { status: 500 }
    );
  }

  const limit = parseVideoLimit(request.nextUrl.searchParams.get("limit"), {
    defaultLimit: config.defaultLimit,
    maxLimit: config.maxLimit,
  });
  const format = parseVideoFormat(request.nextUrl.searchParams.get("format"));

  try {
    const data = await getLatestVideos(limit, format);
    return NextResponse.json({ data } satisfies YoutubeVideosResponse);
  } catch (error) {
    console.error("[youtube:videos:GET] fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube videos", data: [] } satisfies YoutubeVideosResponse & {
        error: string;
      },
      { status: 500 }
    );
  }
}
