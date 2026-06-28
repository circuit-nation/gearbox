import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getYoutubeConfig } from "./config";

describe("getYoutubeConfig", () => {
  it("throws when YOUTUBE_API_KEY is missing", () => {
    assert.throws(() => getYoutubeConfig({}), /YOUTUBE_API_KEY/);
  });

  it("returns defaults for optional values", () => {
    const cfg = getYoutubeConfig({ YOUTUBE_API_KEY: "test-key" });
    assert.equal(cfg.apiKey, "test-key");
    assert.equal(cfg.channelHandle, "circuit_nation");
    assert.equal(cfg.defaultLimit, 5);
    assert.equal(cfg.maxLimit, 25);
    assert.equal(cfg.cacheTtlMs, 6 * 60 * 60 * 1000);
    assert.equal(cfg.shortMaxSeconds, 120);
    assert.equal(cfg.playlistFetchSize, 50);
  });
});
