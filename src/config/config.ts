const getOptionalEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.trim() ? value : undefined;
};

export const ENV = {
  CN_AWS_ACCESS_KEY: getOptionalEnv("CN_AWS_ACCESS_KEY"),
  CN_AWS_SECRET_KEY: getOptionalEnv("CN_AWS_SECRET_KEY"),
  CN_AWS_S3_REGION: getOptionalEnv("CN_AWS_S3_REGION"),
  CN_MONGODB_URI: getOptionalEnv("CN_MONGODB_URI"),
  CN_S3_BUCKET: getOptionalEnv("CN_S3_BUCKET"),
  TIER_NATION_ADMIN_PASSWORD: getOptionalEnv("TIER_NATION_ADMIN_PASSWORD"),
  TIER_NATION_ADMIN_USERNAME: getOptionalEnv("TIER_NATION_ADMIN_USERNAME"),
  TIER_NATION_API_BASE_URL: getOptionalEnv("TIER_NATION_API_BASE_URL"),
  ADMIN_SESSION_SECRET: getOptionalEnv("ADMIN_SESSION_SECRET"),
  YOUTUBE_API_KEY: getOptionalEnv("YOUTUBE_API_KEY"),
  YOUTUBE_CHANNEL_HANDLE: getOptionalEnv("YOUTUBE_CHANNEL_HANDLE"),
  YOUTUBE_VIDEOS_DEFAULT_LIMIT: getOptionalEnv("YOUTUBE_VIDEOS_DEFAULT_LIMIT"),
  YOUTUBE_VIDEOS_MAX_LIMIT: getOptionalEnv("YOUTUBE_VIDEOS_MAX_LIMIT"),
  YOUTUBE_VIDEOS_CACHE_TTL_MS: getOptionalEnv("YOUTUBE_VIDEOS_CACHE_TTL_MS"),
  YOUTUBE_SHORT_MAX_SECONDS: getOptionalEnv("YOUTUBE_SHORT_MAX_SECONDS"),
  YOUTUBE_VIDEOS_PLAYLIST_FETCH_SIZE: getOptionalEnv("YOUTUBE_VIDEOS_PLAYLIST_FETCH_SIZE"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

export const IS_PRODUCTION = ENV.NODE_ENV === "production";
