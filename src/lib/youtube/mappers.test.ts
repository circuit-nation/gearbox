import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapYouTubeVideo } from "./mappers";

describe("mapYouTubeVideo", () => {
  it("maps API video to contract shape", () => {
    const result = mapYouTubeVideo(
      {
        id: "abc123",
        snippet: {
          title: "Ground effect, explained in 9 minutes",
          publishedAt: "2026-06-14T12:00:00Z",
          thumbnails: { high: { url: "https://i.ytimg.com/vi/abc123/hqdefault.jpg" } },
        },
        contentDetails: { duration: "PT9M10S" },
        statistics: { viewCount: "88000" },
      },
      120
    );

    assert.deepEqual(result, {
      id: "abc123",
      title: "Ground effect, explained in 9 minutes",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      durationSeconds: 550,
      viewCount: 88000,
      publishedAt: "2026-06-14T12:00:00Z",
      url: "https://www.youtube.com/watch?v=abc123",
      format: "long",
    });
  });
});
