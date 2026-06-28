import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyVideoFormat, filterVideosByFormat, parseVideoFormat } from "./format";
import type { YoutubeVideo } from "./types";

describe("classifyVideoFormat", () => {
  it("classifies at or below threshold as short", () => {
    assert.equal(classifyVideoFormat(120, 120), "short");
    assert.equal(classifyVideoFormat(30, 120), "short");
  });

  it("classifies above threshold as long", () => {
    assert.equal(classifyVideoFormat(121, 120), "long");
    assert.equal(classifyVideoFormat(550, 120), "long");
  });
});

describe("parseVideoFormat", () => {
  it("defaults to long", () => {
    assert.equal(parseVideoFormat(null), "long");
    assert.equal(parseVideoFormat("invalid"), "long");
  });

  it("accepts short, long, and all", () => {
    assert.equal(parseVideoFormat("short"), "short");
    assert.equal(parseVideoFormat("long"), "long");
    assert.equal(parseVideoFormat("all"), "all");
  });
});

describe("filterVideosByFormat", () => {
  const videos: YoutubeVideo[] = [
    {
      id: "a",
      title: "Short",
      thumbnailUrl: "",
      durationSeconds: 30,
      viewCount: 1,
      publishedAt: "2026-01-01T00:00:00Z",
      url: "https://www.youtube.com/watch?v=a",
      format: "short",
    },
    {
      id: "b",
      title: "Long",
      thumbnailUrl: "",
      durationSeconds: 600,
      viewCount: 2,
      publishedAt: "2026-01-02T00:00:00Z",
      url: "https://www.youtube.com/watch?v=b",
      format: "long",
    },
  ];

  it("returns only long-form by default filter", () => {
    assert.deepEqual(filterVideosByFormat(videos, "long"), [videos[1]]);
  });

  it("returns all when format is all", () => {
    assert.equal(filterVideosByFormat(videos, "all").length, 2);
  });
});
