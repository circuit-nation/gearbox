export type YoutubeVideoFormat = "short" | "long";

export type VideoFormatFilter = YoutubeVideoFormat | "all";

export type YoutubeVideo = {
  id: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string;
  url: string;
  format: YoutubeVideoFormat;
};

export type YoutubeVideosResponse = {
  data: YoutubeVideo[];
};
