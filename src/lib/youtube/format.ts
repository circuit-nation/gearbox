import type { VideoFormatFilter, YoutubeVideo, YoutubeVideoFormat } from "./types";

const DEFAULT_FORMAT_FILTER: VideoFormatFilter = "long";

export function classifyVideoFormat(
  durationSeconds: number,
  shortMaxSeconds: number
): YoutubeVideoFormat {
  return durationSeconds <= shortMaxSeconds ? "short" : "long";
}

export function parseVideoFormat(raw: string | null): VideoFormatFilter {
  if (raw === "short" || raw === "long" || raw === "all") {
    return raw;
  }
  return DEFAULT_FORMAT_FILTER;
}

export function filterVideosByFormat(
  videos: YoutubeVideo[],
  format: VideoFormatFilter
): YoutubeVideo[] {
  if (format === "all") {
    return videos;
  }
  return videos.filter((video) => video.format === format);
}
