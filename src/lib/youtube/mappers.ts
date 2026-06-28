import { classifyVideoFormat } from "./format";
import type { YoutubeVideo } from "./types";
import { parseIso8601Duration, pickThumbnailUrl, type Thumbnails } from "./utils";

export type YouTubeApiVideo = {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: Thumbnails;
  };
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
};

export function mapYouTubeVideo(item: YouTubeApiVideo, shortMaxSeconds: number): YoutubeVideo {
  const durationSeconds = parseIso8601Duration(item.contentDetails.duration);

  return {
    id: item.id,
    title: item.snippet.title,
    thumbnailUrl: pickThumbnailUrl(item.snippet.thumbnails),
    durationSeconds,
    viewCount: Number(item.statistics.viewCount ?? 0),
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    format: classifyVideoFormat(durationSeconds, shortMaxSeconds),
  };
}
