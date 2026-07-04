export type YoutubeConfig = {
  apiKey: string;
  channelHandle: string;
  defaultLimit: number;
  maxLimit: number;
  cacheTtlMs: number;
  shortMaxSeconds: number;
  playlistFetchSize: number;
};

type EnvLike = Record<string, string | undefined>;

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const DEFAULT_SHORT_MAX_SECONDS = 120;
const DEFAULT_PLAYLIST_FETCH_SIZE = 50;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function getYoutubeConfig(env: EnvLike = process.env): YoutubeConfig {
  const apiKey = env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY");
  }

  return {
    apiKey,
    channelHandle: env.YOUTUBE_CHANNEL_HANDLE?.trim() || "circuit_nation",
    defaultLimit: parsePositiveInt(env.YOUTUBE_VIDEOS_DEFAULT_LIMIT, 5),
    maxLimit: parsePositiveInt(env.YOUTUBE_VIDEOS_MAX_LIMIT, 25),
    cacheTtlMs: parsePositiveInt(env.YOUTUBE_VIDEOS_CACHE_TTL_MS, SIX_HOURS_MS),
    shortMaxSeconds: parsePositiveInt(env.YOUTUBE_SHORT_MAX_SECONDS, DEFAULT_SHORT_MAX_SECONDS),
    playlistFetchSize: Math.min(
      parsePositiveInt(env.YOUTUBE_VIDEOS_PLAYLIST_FETCH_SIZE, DEFAULT_PLAYLIST_FETCH_SIZE),
      50
    ),
  };
}
