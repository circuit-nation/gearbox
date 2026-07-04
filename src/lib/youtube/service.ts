import type { YoutubeConfig } from "./config";
import { filterVideosByFormat } from "./format";
import { mapYouTubeVideo, type YouTubeApiVideo } from "./mappers";
import type { VideoFormatFilter, YoutubeVideo } from "./types";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

type YoutubeServiceDeps = {
  config: YoutubeConfig;
  fetchImpl?: typeof fetch;
};

type ChannelCache = {
  channelId: string;
  uploadsPlaylistId: string;
} | null;

type ResponseCache = {
  expiresAt: number;
  data: YoutubeVideo[];
} | null;

export function createYoutubeService({ config, fetchImpl = fetch }: YoutubeServiceDeps) {
  let channelCache: ChannelCache = null;
  let responseCache: ResponseCache = null;

  async function youtubeGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${YOUTUBE_API}/${path}`);
    url.searchParams.set("key", config.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetchImpl(url);
    if (!res.ok) {
      throw new Error(`YouTube API ${path}: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async function resolveChannel(): Promise<{ channelId: string; uploadsPlaylistId: string }> {
    if (channelCache) {
      return channelCache;
    }

    const data = await youtubeGet<{
      items?: Array<{
        id: string;
        contentDetails: { relatedPlaylists: { uploads: string } };
      }>;
    }>("channels", {
      part: "contentDetails",
      forHandle: config.channelHandle,
    });

    const channel = data.items?.[0];
    if (!channel) {
      throw new Error(`Channel not found for handle: ${config.channelHandle}`);
    }

    channelCache = {
      channelId: channel.id,
      uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
    };

    return channelCache;
  }

  async function fetchPlaylistVideos(): Promise<YoutubeVideo[]> {
    const { uploadsPlaylistId } = await resolveChannel();

    const playlistData = await youtubeGet<{
      items?: Array<{ contentDetails: { videoId: string } }>;
    }>("playlistItems", {
      part: "contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: String(config.playlistFetchSize),
    });

    const videoIds = (playlistData.items ?? [])
      .map((item) => item.contentDetails.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return [];
    }

    const videosData = await youtubeGet<{ items?: YouTubeApiVideo[] }>("videos", {
      part: "contentDetails,statistics,snippet",
      id: videoIds.join(","),
    });

    const byId = new Map(
      (videosData.items ?? []).map((item) => [
        item.id,
        mapYouTubeVideo(item, config.shortMaxSeconds),
      ])
    );

    return videoIds
      .map((id) => byId.get(id))
      .filter((video): video is YoutubeVideo => video !== undefined);
  }

  async function getCachedPlaylistVideos(): Promise<YoutubeVideo[]> {
    const now = Date.now();
    if (responseCache && responseCache.expiresAt > now) {
      return responseCache.data;
    }

    const data = await fetchPlaylistVideos();

    if (config.cacheTtlMs > 0) {
      responseCache = { data, expiresAt: now + config.cacheTtlMs };
    }

    return data;
  }

  async function getLatestVideos(
    limit: number,
    format: VideoFormatFilter = "long"
  ): Promise<YoutubeVideo[]> {
    const videos = await getCachedPlaylistVideos();
    return filterVideosByFormat(videos, format).slice(0, limit);
  }

  return { getLatestVideos };
}

let defaultService: ReturnType<typeof createYoutubeService> | null = null;

export async function getLatestVideos(
  limit: number,
  format: VideoFormatFilter = "long"
): Promise<YoutubeVideo[]> {
  if (!defaultService) {
    const { getYoutubeConfig } = await import("./config");
    defaultService = createYoutubeService({ config: getYoutubeConfig() });
  }
  return defaultService.getLatestVideos(limit, format);
}
